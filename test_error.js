const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    try {
        console.log("Navigating to localhost...");
        await page.goto('http://localhost:3004', { waitUntil: 'networkidle2' });
        
        console.log("Clicking 'Join Interview'...");
        const joinBtn = await page.waitForXPath(`//button[contains(., 'Join Interview')]`);
        await joinBtn.click();
        
        console.log("Filling form...");
        await page.waitForSelector('input[placeholder="e.g. John Doe"]');
        await page.type('input[placeholder="e.g. John Doe"]', 'Test User');
        await page.type('input[placeholder="e.g. RC-2024-001"]', 'RC-1234');
        await page.type('input[placeholder="••••"]', '0000');
        
        console.log("Clicking Start Session...");
        const startBtn = await page.waitForXPath(`//button[contains(., 'START SESSION')]`);
        await startBtn.click();
        
        console.log("Waiting for error or Camera Check...");
        await page.waitForTimeout(3000);
        
        console.log("Taking screenshot if possible...");
        await page.screenshot({ path: 'test_error_ss.png' });
        
    } catch(err) {
        console.log("Test error:", err);
    } finally {
        await browser.close();
    }
})();
