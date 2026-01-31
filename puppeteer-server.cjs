const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let browser = null;

// Initialize browser on server start
async function initBrowser() {
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        console.log('Puppeteer browser initialized');
    } catch (error) {
        console.error('Failed to initialize browser:', error);
    }
}

// Puppeteer endpoint
app.post('/puppeteer', async (req, res) => {
    try {
        if (!browser) {
            await initBrowser();
        }

        const { action, url, selector, text, waitTime, script, outputPath } = req.body;
        let page;

        try {
            switch (action) {
                case 'goto':
                    if (!url) {
                        return res.json({ error: 'URL is required for goto action' });
                    }
                    page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    await page.close();
                    return res.json({ success: true, message: `Successfully navigated to: ${url}` });

                case 'screenshot':
                    if (!url) {
                        return res.json({ error: 'URL is required for screenshot action' });
                    }
                    page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    
                    const screenshotPath = outputPath || path.join(process.cwd(), 'screenshot.png');
                    await page.screenshot({ 
                        path: screenshotPath, 
                        fullPage: true,
                        type: 'png'
                    });
                    await page.close();
                    return res.json({ success: true, message: `Screenshot saved to: ${screenshotPath}` });

                case 'click':
                    if (!url || !selector) {
                        return res.json({ error: 'Both URL and selector are required for click action' });
                    }
                    page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    await page.waitForSelector(selector, { timeout: 10000 });
                    await page.click(selector);
                    await page.close();
                    return res.json({ success: true, message: `Successfully clicked element: ${selector}` });

                case 'type':
                    if (!url || !selector || !text) {
                        return res.json({ error: 'URL, selector, and text are required for type action' });
                    }
                    page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    await page.waitForSelector(selector, { timeout: 10000 });
                    await page.type(selector, text);
                    await page.close();
                    return res.json({ success: true, message: `Successfully typed "${text}" into element: ${selector}` });

                case 'scroll':
                    if (!url) {
                        return res.json({ error: 'URL is required for scroll action' });
                    }
                    page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    await page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight);
                    });
                    await page.close();
                    return res.json({ success: true, message: 'Scrolled to bottom of page' });

                case 'wait':
                    const time = waitTime || 3000;
                    await new Promise(resolve => setTimeout(resolve, time));
                    return res.json({ success: true, message: `Waited for ${time}ms` });

                case 'evaluate':
                    if (!url || !script) {
                        return res.json({ error: 'Both URL and script are required for evaluate action' });
                    }
                    page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.goto(url, { waitUntil: 'networkidle2' });
                    const result = await page.evaluate(script);
                    await page.close();
                    return res.json({ success: true, message: `Script executed. Result: ${JSON.stringify(result, null, 2)}` });

                case 'close':
                    if (browser) {
                        await browser.close();
                        browser = null;
                    }
                    return res.json({ success: true, message: 'Browser closed successfully' });

                default:
                    return res.json({ error: `Unknown action "${action}"` });
            }
        } finally {
            // Ensure page is closed if it was created
            if (page && action !== 'close') {
                try {
                    await page.close();
                } catch (e) {
                    // Ignore close errors
                }
            }
        }
    } catch (error) {
        console.error('Puppeteer error:', error);
        res.json({ error: `Error executing Puppeteer operation: ${error.message}` });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', browser: browser ? 'initialized' : 'not initialized' });
});

// Initialize browser and start server
initBrowser().then(() => {
    app.listen(PORT, () => {
        console.log(`Puppeteer server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});
