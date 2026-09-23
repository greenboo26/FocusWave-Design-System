/* Build a single self-contained HTML file from the local FocusWave site.
 *
 * Why: the original site boots through ES module dynamic import() and uses
 * import.meta.url to resolve asset paths. Both are blocked under file://,
 * so double-clicking index.html shows a blank page. This script inlines
 * every local <script src> and every dynamic import() into one classic
 * script, and rewrites import.meta.url asset URLs to plain relative paths
 * (relative asset URLs work fine under file://).
 *
 * Run:  node build-standalone.js
 * Out:  FocusWave-standalone.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'FocusWave-standalone.html');
const SKIP = new Set(['start-server.bat', 'sync-to-repo.bat', 'build-standalone.js']);

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

// Collect every local script that is reachable from the module graph.
function resolveModule(fromFile, spec) {
  const clean = spec.split('?')[0];
  return path.normalize(path.join(path.dirname(fromFile), clean)).replace(/\\/g, '/');
}

const html = read('index.html');

// 1. Which scripts does index.html reference directly?
const directScripts = [...html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"\s*><\/script>/g)].map(m => m[1]);
if (!directScripts.length) throw new Error('no <script src> found in index.html');

// 2. Walk the dynamic import graph, breadth first.
const queue = [...directScripts];
const order = [];
const seen = new Set();
while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  order.push(file);
  const src = read(file);
  const specs = [
    ...src.matchAll(/import\(\s*'([^']+)'\s*\)/g),
    ...src.matchAll(/import\(\s*"([^"]+)"\s*\)/g)
  ].map(m => m[1]);
  for (const spec of specs) {
    if (/^https?:/.test(spec)) continue;
    const target = resolveModule(file, spec);
    if (fs.existsSync(path.join(ROOT, target)) && !SKIP.has(target)) queue.push(target);
  }
}

console.log('Module graph resolved (' + order.length + ' files):');
order.forEach(f => console.log('  - ' + f));

// 3. Verify every dynamic import target exists, then inline the sources.
const available = new Set(order);
const problems = [];

// Content JSON is normally fetched at runtime, which file:// blocks. Inline it
// as a global and rewrite the fetch() calls to read from that global instead.
const contentGlobals = [];
const contentRewrites = [];
const CONTENT_FILES = ['content/curated-quotes.json'];
CONTENT_FILES.forEach(rel => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { problems.push('missing content file ' + rel); return; }
  const varName = '__FW_CONTENT_' + rel.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  contentGlobals.push('window.' + varName + ' = ' + JSON.stringify(JSON.parse(fs.readFileSync(abs, 'utf8'))) + ';');
  // Match literally: fetch('./content/x.json')  (slashes need no escaping here)
  contentRewrites.push({
    varName,
    pattern: new RegExp("fetch\\('\\./" + rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'\\)", 'g')
  });
});

// Strip dynamic import() loader stubs: their targets are already inlined above,
// so execute them in order instead of loading them asynchronously.
// Note: the replacement must be a *bare expression* (no trailing semicolon),
// because these calls also appear as arrow-function bodies like
// `.then(() => import('./x.js'))` where a semicolon would be a syntax error.
function stripLoaderImports(file, src) {
  const specs = [];
  const out = src.replace(/import\(\s*['"]([^'"]+)['"]\s*\)/g, (match, spec) => {
    if (/^https?:/.test(spec)) return match;
    const target = resolveModule(file, spec);
    if (available.has(target)) { specs.push(target); return 'Promise.resolve()'; }
    problems.push(file + ': unresolved dynamic import -> ' + spec);
    return match;
  });
  return { src: out, specs };
}

const bundle = [];
const runOrder = [];
order.forEach((file, index) => {
  let src = read(file);

  // Rewrite import.meta.url asset resolution to plain relative paths.
  src = src.replace(
    /new URL\(\s*'\.\/([^']+)'\s*,\s*import\.meta\.url\s*\)\.href/g,
    "'./$1'"
  );
  if (/import\.meta/.test(src)) problems.push(file + ': leftover import.meta usage');

  // Replace runtime fetch('./content/x.json') with an inline JSON promise.
  contentRewrites.forEach(rw => {
    if (rw.pattern.test(src)) {
      src = src.replace(rw.pattern, 'Promise.resolve({ok:true,json:()=>Promise.resolve(window.' + rw.varName + ')})');
      rw.pattern.lastIndex = 0;
    }
  });

  const stripped = stripLoaderImports(file, src);
  // Only the module-graph root loads the rest; keep its stub list to drive order.
  if (index === 0) {
    stripped.specs.forEach(s => { if (!runOrder.includes(s)) runOrder.push(s); });
  }

  bundle.push('/* ===== ' + file + ' ===== */\n' + stripped.src);
});

if (problems.length) {
  console.error('\nCannot inline cleanly:');
  problems.forEach(p => console.error('  ! ' + p));
  process.exit(1);
}

// 4. Replace the original script tag(s) with the inlined bundle.
// The loader stubs now do nothing, so emit the modules in dependency order:
// the root first (it defines window.FocusWaveIdiomGrammar and friends), then
// each dynamically-imported module in the order the root requested it.
const rootFile = order[0];
const rootBundle = bundle[0];
const restByName = new Map();
bundle.slice(1).forEach((chunk, i) => restByName.set(order[i + 1], chunk));

const orderedBundle = [rootBundle];
runOrder.forEach(name => {
  const chunk = restByName.get(name);
  if (!chunk) { problems.push('missing chunk for ' + name); return; }
  orderedBundle.push(chunk);
  restByName.delete(name);
});
// Anything reachable but never named by the root loader still gets emitted.
restByName.forEach(chunk => orderedBundle.push(chunk));

const standalone = contentGlobals.join('\n') + '\n\n' + orderedBundle.join('\n\n');

// Replace the root <script src> tag in place instead of injecting into <head>.
// The dynamic-import version of the site executes these modules only after the
// document has been parsed (import() resolves once the parser reaches the end
// of the body). Inlining them into <head> changed that timing: modules that
// touch the DOM at top level (e.g. dusk-water-reflection.js binding
// #beginLive/#themeGroup/#startFocus) saw a null document and silently lost
// their bindings in the standalone build. Keeping the bundle at the original
// end-of-body position preserves index.html's execution order exactly.
const rootTag = html.match(/<script src="\.\/[^"]+"\s*><\/script>/);
if (!rootTag) throw new Error('root <script src> tag not found');
let out = html.replace(rootTag[0], '<!-- Self-contained build: all local modules inlined for file:// use. -->\n<script>\n' + standalone + '\n</script>');
for (const m of out.matchAll(/<script src="\.\/[^"]+"\s*><\/script>/g)) {
  out = out.replace(m[0], '');
}

fs.writeFileSync(OUT, out);
console.log('\nWrote ' + path.basename(OUT) + ' (' + (out.length / 1024).toFixed(0) + ' KB)');
