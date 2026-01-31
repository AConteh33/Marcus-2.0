const puppeteer = require('puppeteer');

async function createGoogleMeet() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to Google Meet
        await page.goto('https://meet.google.com', { waitUntil: 'networkidle2' });
        
        // Wait for the page to load and click "New meeting"
        await page.waitForSelector('[data-is-meeting-code="false"]', { timeout: 10000 });
        await page.click('[data-is-meeting-code="false"]');
        
        // Wait for meeting to start and get the meeting URL
        await page.waitForTimeout(3000);
        
        // Get the current URL which should contain the meeting code
        const meetingUrl = page.url();
        
        // Try to get meeting link from the page
        let meetingLink = meetingUrl;
        
        try {
            // Look for the meeting link element
            const linkElement = await page.$('input[readonly]');
            if (linkElement) {
                meetingLink = await page.evaluate(el => el.value, linkElement);
            }
        } catch (e) {
            console.log('Could not find meeting link element, using URL');
        }
        
        console.log('Google Meet created successfully!');
        console.log('Meeting Link:', meetingLink);
        
        // Copy meeting link to clipboard (if possible)
        try {
            await page.evaluate(() => {
                const linkInput = document.querySelector('input[readonly]');
                if (linkInput) {
                    linkInput.select();
                    document.execCommand('copy');
                }
            });
            console.log('Meeting link copied to clipboard!');
        } catch (e) {
            console.log('Could not copy to clipboard automatically');
        }
        
        // Keep the browser open for the meeting
        console.log('Meeting is now active. Browser will remain open.');
        console.log('Press Ctrl+C to close the browser and end the meeting.');
        
        // Wait for manual browser close
        await new Promise(resolve => {
            browser.on('disconnected', resolve);
        });
        
    } catch (error) {
        console.error('Error creating Google Meet:', error);
        await browser.close();
    }
}

// Run the function
createGoogleMeet().catch(console.error);
