const { chromium } = require('playwright');

const base = process.env.FW_BASE || 'https://greenboo26.github.io/FocusWave-Design-System/';

async function inspect(page, profile, name) {
  const state = await page.evaluate(() => ({
    activePage: document.querySelector('.page.active')?.id,
    viewport: { width: innerWidth, height: innerHeight },
    document: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    },
    railDisplay: getComputedStyle(document.querySelector('#rail')).display,
    visibleNav: [...document.querySelectorAll('[data-nav]')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
      })
      .map((el) => el.textContent.trim()),
    clipped: [...document.querySelectorAll('button, input, h1, h2, h3, p, canvas')]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > innerWidth + 1 || rect.left < -1;
      })
      .slice(0, 15)
      .map((el) => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: el.textContent?.trim().slice(0, 50),
      })),
  }));
  console.log(`AUDIT ${profile} ${name} ${JSON.stringify(state)}`);
  await page.screenshot({ path: `work/${profile}-${name}.png`, fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  for (const profile of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } },
  ]) {
    const page = await browser.newPage({ viewport: profile.viewport });
    const runtime = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        runtime.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => runtime.push(`pageerror: ${error.message}`));

    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await inspect(page, profile.name, 'today');

    for (const name of ['insights', 'portraits', 'practice', 'settings']) {
      await page.locator(`[data-nav="${name}"]`).click();
      await page.waitForTimeout(name === 'insights' ? 900 : 500);
      if (name === 'settings') {
        await page.locator('[data-setting="ai"]').click();
        await page.waitForTimeout(250);
        await page.locator('#aiIntegrationDetails').click();
        const integrationExpanded = await page.locator('#aiIntegrationDetail').isVisible();
        await page.locator('.content-library-entry').click();
        await page.waitForTimeout(700);
        const libraryOpen = await page.locator('#contentLibraryOverlay.open').isVisible();
        console.log(`INTERACTION ${profile.name} settings ${JSON.stringify({ integrationExpanded, libraryOpen })}`);
        await page.locator('#closeLibrary').click();
      }
      await inspect(page, profile.name, name);
    }

    await page.locator('[data-nav="today"]').click();
    await page.locator('#startFocus').click();
    await page.waitForTimeout(500);
    await inspect(page, profile.name, 'setup');
    await page.locator('#toDevice').click();
    await page.waitForTimeout(1800);
    await inspect(page, profile.name, 'device');
    await page.locator('#beginLive').click();
    await page.waitForTimeout(900);
    await inspect(page, profile.name, 'live');
    await page.locator('#finishBtn').click();
    await page.waitForTimeout(500);
    await page.locator('#generateAIReflection').click();
    await page.waitForTimeout(900);
    await inspect(page, profile.name, 'summary');

    console.log(`RUNTIME ${profile.name} ${JSON.stringify(runtime)}`);
    await page.close();
  }

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
