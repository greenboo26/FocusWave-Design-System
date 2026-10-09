/* Read-only repository inventory and source checks. Requires only Node.js and Git.
 * Run: node scripts/audit-repository.cjs [--output path.json]
 * An optional output file is the only filesystem write made by this script.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync, spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const git = (...args) => execFileSync('git', args, {cwd:root, encoding:'utf8', maxBuffer:16*1024*1024}).trim();
const candidate = 'arena/01a0cc25-focuswave-design-system';
const candidateSha = 'e6b98ff31dce179bd21fe7be87dc112f6b5b21a8';
const branches = git('for-each-ref','--format=%(refname:strip=3)','refs/remotes/origin')
  .split('\n').filter(name=>name&&name!=='HEAD');
const entry = 'prototype/daily-focus-v1/index.html';

function inspect(ref, workingTree=false) {
  const files = git('ls-tree','-r','--name-only',ref).split('\n');
  const fileSet = new Set(files);
  if(workingTree) git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean).forEach(f=>fileSet.add(f));
  const cache = new Map();
  function read(file) {
    if(!cache.has(file)) cache.set(file, workingTree ? fs.readFileSync(path.join(root,file),'utf8') : git('show',`${ref}:${file}`));
    return cache.get(file);
  }
  const errors=[];
  let jsChecks=0, inlineChecks=0, jsonChecks=0;
  for(const file of fileSet) {
    if(/\.(?:js|cjs)$/.test(file)) {
      const result=spawnSync(process.execPath,['--check',`--input-type=${file.endsWith('.cjs')?'commonjs':'module'}`], {input:read(file),encoding:'utf8'});
      jsChecks++;
      if(result.status!==0) errors.push({file,kind:'javascript_syntax',message:(result.stderr||result.error?.message||'Check failed').trim()});
    } else if(file.endsWith('.json')) {
      jsonChecks++;
      try {JSON.parse(read(file));} catch(e) {errors.push({file,kind:'json_parse',message:e.message});}
    } else if(file.endsWith('.html')) {
      let n=0;
      for(const match of read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if(/\bsrc\s*=/.test(match[1])||!match[2].trim()) continue;
        if(/type\s*=\s*["'](?:module|application\/)/.test(match[1])) continue;
        inlineChecks++;
        try {new vm.Script(match[2],{filename:`${file}#script-${++n}`});} catch(e) {errors.push({file,kind:'inline_script_syntax',message:e.message});}
      }
    }
  }

  const active=new Set(), missing=[], queue=[entry];
  while(queue.length) {
    const file=queue.shift();
    if(active.has(file)) continue;
    active.add(file);
    if(!/\.(?:html|js|css)$/.test(file)) continue;
    const refs=[...read(file).matchAll(/["'](\.\.?\/[^"'\r\n]+\.(?:js|css|json|png|jpg|jpeg|svg|webp|woff2|glb)(?:\?[^"'\r\n]*)?)["']/g)].map(m=>m[1]);
    for(const item of refs) {
      if(item.includes('${')) continue;
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(file), item.split('?')[0]));
      if(!fileSet.has(target)) missing.push({from:file,target});
      else if(!active.has(target)) queue.push(target);
    }
  }
  const contentCopies=[];
  for(const file of fileSet) {
    if(!/^content\/.*\.json$/.test(file)) continue;
    const deployed=`prototype/daily-focus-v1/${file}`;
    contentCopies.push({source:file,deployed,identical:fileSet.has(deployed)&&JSON.stringify(JSON.parse(read(file)))===JSON.stringify(JSON.parse(read(deployed)))});
  }
  return {
    ref,sha:git('rev-parse',ref),trackedFiles:files.length,
    checks:{javascript:jsChecks,inlineScripts:inlineChecks,json:jsonChecks},
    sourceErrors:errors,activeMissingReferences:missing,
    activeFiles:[...active].sort(),
    unreferencedJavaScript:files.filter(f=>f.startsWith('prototype/daily-focus-v1/')&&f.endsWith('.js')&&!active.has(f)&&!path.posix.basename(f).startsWith('build-')).sort(),
    contentCopies
  };
}
const snapshots=branches.map(name=>inspect(`origin/${name}`));
const pairs=[['main','li']];
if(branches.includes(candidate))pairs.push(['li',candidate]);
const comparisons=pairs.map(([left,right])=>{
  const [leftOnly,rightOnly]=git('rev-list','--left-right','--count',`origin/${left}...origin/${right}`).split(/\s+/).map(Number);
  return {left,right,leftOnly,rightOnly,commonAncestor:git('merge-base',`origin/${left}`,`origin/${right}`)};
});
let candidateMerged=false;
try{git('merge-base','--is-ancestor',candidateSha,'origin/li');candidateMerged=true;}catch(_){/* not merged, or source unavailable */}
const report={generatedAt:new Date().toISOString(),remote:git('remote','get-url','origin'),localBranch:git('branch','--show-current'),workingTreeStatus:git('status','--short'),comparisons,snapshots,retiredCandidate:{branch:candidate,sourceSha:candidateSha,remoteBranchPresent:branches.includes(candidate),mergedIntoRelease:candidateMerged},workingTree:inspect('HEAD',true),limitations:['Static literal references only; computed and external URLs require separate inspection.','Syntax checks are not interaction or scientific validation.','Branch snapshots are read from fetched origin references; run git fetch --prune origin first.']};
const at=process.argv.indexOf('--output');
if(at>=0) {
  if(!process.argv[at+1]) throw new Error('--output requires a path');
  const target=path.resolve(process.argv[at+1]);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({comparisons,branches:snapshots.map(s=>({ref:s.ref,sha:s.sha,files:s.trackedFiles,checks:s.checks,sourceErrors:s.sourceErrors.length,activeMissingReferences:s.activeMissingReferences})),workingTree:{checks:report.workingTree.checks,sourceErrors:report.workingTree.sourceErrors,activeMissingReferences:report.workingTree.activeMissingReferences}},null,2));
if([...snapshots,report.workingTree].some(s=>s.sourceErrors.length||s.activeMissingReferences.length)) process.exitCode=1;
