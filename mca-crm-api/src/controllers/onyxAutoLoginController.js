const puppeteer = require('puppeteer');

/**
 * Automated OnyxIQ login controller
 * Uses Puppeteer to automatically login and extract bearer token
 */
class OnyxAutoLoginController {
  
  /**
   * Automatically login to OnyxIQ and extract bearer token
   */
  async autoLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      console.log('Starting automated OnyxIQ login...');
      
      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      const timeout = 30000; // Increased to 30 seconds
      page.setDefaultTimeout(timeout);

      // Set viewport
      await page.setViewport({
        width: 1920,
        height: 919
      });

      // Navigate to OnyxIQ login page with increased timeout
      await page.goto('https://app.onyxiq.com/login', { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Set up network request monitoring to capture bearer token
      let bearerToken = null;
      let tokenCaptured = false;
      
      page.on('request', (request) => {
        const headers = request.headers();
        if (headers.authorization && headers.authorization.startsWith('Bearer ') && !tokenCaptured) {
          bearerToken = headers.authorization.replace('Bearer ', '');
          tokenCaptured = true;
          console.log('Bearer token captured:', bearerToken.substring(0, 20) + '...');
        }
      });

      // Wait for page to load and fill email
      await page.waitForSelector('#mat-input-0', { timeout: 30000 });
      await puppeteer.Locator.race([
        page.locator('::-p-aria(Email)'),
        page.locator('#mat-input-0'),
        page.locator('::-p-xpath(//*[@id="mat-input-0"])'),
        page.locator(':scope >>> #mat-input-0')
      ])
        .setTimeout(timeout)
        .click({
          offset: {
            x: 95,
            y: 22.5,
          },
        });

      await puppeteer.Locator.race([
        page.locator('::-p-aria(Email)'),
        page.locator('#mat-input-0'),
        page.locator('::-p-xpath(//*[@id="mat-input-0"])'),
        page.locator(':scope >>> #mat-input-0')
      ])
        .setTimeout(timeout)
        .fill(email);

      // Fill password
      await puppeteer.Locator.race([
        page.locator('::-p-aria(Password)'),
        page.locator('#mat-input-1'),
        page.locator('::-p-xpath(//*[@id="mat-input-1"])'),
        page.locator(':scope >>> #mat-input-1')
      ])
        .setTimeout(timeout)
        .click({
          offset: {
            x: 100,
            y: 25,
          },
        });

      await puppeteer.Locator.race([
        page.locator('::-p-aria(Password)'),
        page.locator('#mat-input-1'),
        page.locator('::-p-xpath(//*[@id="mat-input-1"])'),
        page.locator(':scope >>> #mat-input-1')
      ])
        .setTimeout(timeout)
        .fill(password);

      // Click login button
      await puppeteer.Locator.race([
        page.locator('::-p-aria(Submit)'),
        page.locator('button'),
        page.locator('::-p-xpath(//*[@id="login-form"]/button)'),
        page.locator(':scope >>> button')
      ])
        .setTimeout(timeout)
        .click({
          offset: {
            x: 76,
            y: 24,
          },
        });

      // Wait for navigation and API requests
      try {
        await page.waitForNavigation({ timeout: 30000 });
      } catch (error) {
        console.log('Navigation timeout, checking for token in existing requests...');
      }

      // If we haven't captured the token yet, wait a bit more for API calls
      if (!bearerToken) {
        console.log('Waiting for API requests to capture token...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // If we have the token, close browser immediately
      if (bearerToken) {
        console.log('Token captured, closing browser...');
        await browser.close();
        
        return res.json({
          success: true,
          bearerToken: bearerToken,
          message: 'Successfully logged in and obtained API token'
        });
      }

      // Close browser
      await browser.close();

      if (!bearerToken) {
        return res.status(401).json({
          success: false,
          message: 'Failed to obtain bearer token. Please check your credentials.'
        });
      }

      console.log('Successfully obtained bearer token');
      
      return res.json({
        success: true,
        bearerToken: bearerToken,
        message: 'Successfully logged in and obtained API token'
      });

    } catch (error) {
      console.error('Auto-login error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to login to OnyxIQ. Please try again.',
        error: error.message
      });
    }
  }
}

module.exports = new OnyxAutoLoginController();
