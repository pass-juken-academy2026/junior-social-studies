'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4173/index.html');
    await page.click('[data-tab="7"]');
    await page.click('[data-start]');
    await page.waitForSelector('[data-mock] .choices button');
    const open = async (kind) => {
      const pending = page.waitForEvent('popup');
      await page.locator('[onclick="exportMockPdf(\'' + kind + '\')"]').click();
      const popup = await pending;
      await popup.waitForLoadState('domcontentloaded');
      const text = await popup.locator('body').innerText();
      const pdf = await popup.pdf({ format: 'A4' });
      assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
      assert.ok(pdf.length > 1000);
      await popup.close();
      return text;
    };
    const questions = await open('questions');
    assert.match(questions, /問題/);
    assert.doesNotMatch(questions, /正解：|解答・解説/);
    const answers = await open('answers');
    assert.match(answers, /正解：/);
    assert.match(answers, /解説：/);
    const combined = await open('combined');
    assert.match(combined, /問題/);
    assert.match(combined, /解答・解説/);
    assert.match(combined, /正解：/);
    console.log('PASS mock PDF exports: three modes and answer isolation');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
