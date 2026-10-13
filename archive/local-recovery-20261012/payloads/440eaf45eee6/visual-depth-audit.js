const { chromium } = require('playwright');

const base = process.env.FW_BASE || 'http://127.0.0.1:8766/';

async function canvasSignature(page, selector) {
  return page.locator(selector).evaluate((canvas) => {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let weighted = 0;
    for (let i = 0; i < data.length; i += Math.max(4, Math.floor(data.length / 5000 / 4) * 4)) {
      weighted = (weighted + data[i] * 3 + data[i + 1] * 5 + data[i + 2] * 7 + data[i + 3] * 11) % 2147483647;
    }
    return { width, height, weighted };
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const profile of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } },
  ]) {
    const page = await browser.newPage({ viewport: profile.viewport });
    const runtime = [];
    page.on('console', (message) => ['error', 'warning'].includes(message.type()) && runtime.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => runtime.push(`pageerror: ${error.message}`));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('focuswave.generatedContentDrafts'));

    const homeBefore = await canvasSignature(page, '#todayCanvas');
    await page.waitForTimeout(1800);
    const homeAfter = await canvasSignature(page, '#todayCanvas');
    console.log(`HOME_MOTION ${profile.name}`, { changed: homeBefore.weighted !== homeAfter.weighted, homeBefore, homeAfter });
    await page.screenshot({ path: `work/${profile.name}-visual-home.png`, fullPage: true });

    await page.locator('[data-nav="insights"]').click();
    await page.waitForTimeout(1400);
    const physicalGarden = await page.evaluate(() => ({
      baseDisplay: getComputedStyle(document.querySelector('#fwGardenCanvas')).display,
      stones: document.querySelectorAll('.fw-stone').length,
      toolbarButtons: document.querySelectorAll('#fwEditTools button').length,
      statFont: getComputedStyle(document.querySelector('.fw-stat-value')).fontFamily,
    }));
    await page.locator('#fwHistoryChart').hover({ position: { x: profile.viewport.width > 700 ? 420 : 220, y: 120 } });
    const tooltipVisible = await page.locator('#fwChartTooltip').isVisible();
    await page.locator('#fwEditGarden').click();
    const toolsVisible = await page.locator('#fwEditTools').isVisible();
    await page.locator('[data-garden-tool="fine"]').click();
    const gardenBox = await page.locator('#fwGardenUserCanvas').boundingBox();
    if (gardenBox) {
      await page.mouse.move(gardenBox.x + gardenBox.width * .28, gardenBox.y + gardenBox.height * .72);
      await page.mouse.down();
      await page.mouse.move(gardenBox.x + gardenBox.width * .68, gardenBox.y + gardenBox.height * .58, { steps: 18 });
      await page.mouse.up();
    }
    console.log(`INSIGHTS ${profile.name}`, { ...physicalGarden, tooltipVisible, toolsVisible });
    await page.screenshot({ path: `work/${profile.name}-visual-insights.png`, fullPage: true });

    await page.locator('[data-nav="settings"]').click();
    await page.locator('[data-setting="ai"]').click();
    await page.locator('.content-library-entry').click();
    await page.waitForTimeout(500);
    const countsBefore = await page.locator('.library-count').allTextContents();
    await page.locator('[data-cat="generated"]').click();
    const generatedBefore = await page.locator('.library-item').count();
    await page.locator('#generateLibraryBatch').click();
    await page.waitForTimeout(900);
    const generatedAfter = await page.locator('.library-item').count();
    const generatedHeading = await page.locator('#libraryHeading').textContent();
    const generateButton = await page.locator('#generateLibraryBatch').textContent();
    console.log(`CONTENT ${profile.name}`, { countsBefore, generatedBefore, generatedAfter, generatedHeading, generateButton });
    await page.screenshot({ path: `work/${profile.name}-content-library.png`, fullPage: true });
    await page.locator('#closeLibrary').click();

    await page.locator('[data-nav="portraits"]').click();
    await page.waitForTimeout(500);
    await page.locator('.portrait-card').first().click();
    await page.waitForTimeout(1100);
    const stateColors = await page.locator('#pdStateLabels i').evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor));
    console.log(`TIMELINE ${profile.name}`, { stateColors, chartSize: await canvasSignature(page, '#pdChart') });
    await page.locator('#pdChart').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `work/${profile.name}-timeline.png`, fullPage: false });

    console.log(`RUNTIME ${profile.name}`, runtime);
    await page.close();
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
