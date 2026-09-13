/* Build all lotus reward assets from the single source PNG (ink_lotus.png).
 *
 * The source is a high-res watercolour lotus (1351x1164) with transparent
 * padding around the flower. We trim to the actual artwork, then export the
 * three size tiers the app uses so every consumer shows the same flower at
 * the same effective scale.
 *
 * Outputs (written back into assets/inkpond/):
 *   ink-lotus-approved.png                96x96   (master, kept for reference)
 *   ink-lotus-approved-transparent.png   128x128  (v3 canvas renderer)
 *   ink-lotus-approved-visible-92.png     92x92   (DOM overlay renderer)
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'assets', 'inkpond');
const SRC = path.join(DIR, 'ink_lotus.png');

// Trim threshold: ignore near-invisible fringe pixels.
const ALPHA_FLOOR = 8;
// Each tier gets a little padding so the flower is not flush to the edge.
const TIERS = [
  { file: 'ink-lotus-approved.png', width: 96, pad: 0.04 },
  { file: 'ink-lotus-approved-transparent.png', width: 128, pad: 0.04 },
  { file: 'ink-lotus-approved-visible-92.png', width: 92, pad: 0.04 }
];

// ---------------------------------------------------------------------------
// 1. Decode the source with the browser (PIL chokes on some PNG streams).
// ---------------------------------------------------------------------------
async function decodeSource() {
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const payload = fs.readFileSync(SRC).toString('base64');
  const result = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();

    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);

    const { data, width, height } = g.getImageData(0, 0, c.width, c.height);

    // Find the tight bounding box of meaningful alpha.
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    // Hand back the trimmed crop as a data URL plus the crop rect.
    const tc = document.createElement('canvas');
    tc.width = maxX - minX + 1; tc.height = maxY - minY + 1;
    tc.getContext('2d').drawImage(c, minX, minY, tc.width, tc.height, 0, 0, tc.width, tc.height);

    return {
      srcWidth: width, srcHeight: height,
      crop: { minX, minY, w: tc.width, h: tc.height },
      trimmedDataUrl: tc.toDataURL('image/png')
    };
  }, payload);

  await browser.close();
  return result;
}

// ---------------------------------------------------------------------------
// 2. Resize the trimmed artwork into each tier with the browser's high-quality
//    scaler, then write the files back to disk.
// ---------------------------------------------------------------------------
async function renderTiers(trimmedDataUrl) {
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const out = await page.evaluate(async ({ url, tiers }) => {
    const img = new Image();
    img.src = url;
    await img.decode();

    const results = [];
    for (const tier of tiers) {
      const side = tier.width;
      const inner = Math.round(side * (1 - tier.pad * 2));
      // Preserve aspect ratio of the (already trimmed) artwork.
      const ratio = img.naturalWidth / img.naturalHeight;
      let w = inner, h = inner;
      if (ratio >= 1) h = Math.round(inner / ratio); else w = Math.round(inner * ratio);

      const c = document.createElement('canvas');
      c.width = side; c.height = side;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.clearRect(0, 0, side, side);
      g.drawImage(img, Math.round((side - w) / 2), Math.round((side - h) / 2), w, h);

      const px = g.getImageData(0, 0, side, side).data;
      let nonTransparent = 0;
      for (let i = 3; i < px.length; i += 4) if (px[i] > 0) nonTransparent++;

      results.push({ file: tier.file, side, drawn: w + 'x' + h, nonTransparent, dataUrl: c.toDataURL('image/png') });
    }
    return results;
  }, { url: trimmedDataUrl, tiers: TIERS });

  await browser.close();

  for (const r of out) {
    const b64 = r.dataUrl.split(',')[1];
    fs.writeFileSync(path.join(DIR, r.file), Buffer.from(b64, 'base64'));
    const total = r.side * r.side;
    console.log(
      r.file.padEnd(34),
      (r.side + 'x' + r.side).padEnd(9),
      ('flower ' + r.drawn).padEnd(18),
      'alpha>0 ' + (100 * r.nonTransparent / total).toFixed(1) + '%'
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// 3. Verify every written file is a structurally valid PNG (has IEND).
// ---------------------------------------------------------------------------
function verifyPng(file) {
  const data = fs.readFileSync(path.join(DIR, file));
  let pos = 8, intact = false;
  while (pos + 8 <= data.length) {
    const len = data.readUInt32BE(pos);
    const type = data.toString('latin1', pos + 4, pos + 8);
    if (pos + 12 + len > data.length) return { file, ok: false, reason: 'truncated chunk ' + type };
    pos += 12 + len;
    if (type === 'IEND') { intact = true; break; }
  }
  return { file, ok: intact, bytes: data.length };
}

(async () => {
  if (!fs.existsSync(SRC)) throw new Error('source not found: ' + SRC);
  console.log('source:', path.basename(SRC), (fs.statSync(SRC).size / 1024).toFixed(0) + ' KB\n');

  const src = await decodeSource();
  console.log('decoded:', src.srcWidth + 'x' + src.srcHeight,
    '-> trimmed content', src.crop.w + 'x' + src.crop.h,
    '(crop at ' + src.crop.minX + ',' + src.crop.minY + ')\n');

  await renderTiers(src.trimmedDataUrl);

  console.log('\nintegrity check:');
  let bad = 0;
  for (const t of TIERS) {
    const v = verifyPng(t.file);
    console.log(' ', v.ok ? 'OK  ' : 'FAIL', v.file, v.ok ? v.bytes + ' bytes' : v.reason);
    if (!v.ok) bad++;
  }
  if (bad) process.exit(1);
  console.log('\nAll lotus assets rebuilt from ink_lotus.png');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
