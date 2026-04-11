import puppeteer from 'puppeteer'

async function tryDeposit() {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  try {
    console.log('Navigating to login...')
    await page.goto('http://localhost:5172/login', { waitUntil: 'networkidle2' })

    console.log('Logging in...')
    await page.type('input[type="email"]', 'test@kikoba.com')
    await page.type('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    console.log('Logged in successfully. URL:', page.url())

    // Click Deposit (Weka Pesa)
    console.log('Clicking deposit button...')
    const depositBtn = await page.$x("//button[contains(., 'Weka Pesa')]")
    if (depositBtn.length > 0) {
      await (depositBtn[0] as any).click()
    } else {
      throw new Error('Could not find Deposit button')
    }

    // Wait for modal
    await page.waitForSelector('input[type="number"]')
    await page.type('input[type="number"]', '5000')

    console.log('Clicking continue...')
    const continueBtn = await page.$x("//button[contains(., 'Endelea')]")
    if (continueBtn.length > 0) {
      await (continueBtn[0] as any).click()
    } else {
      throw new Error('Could not find Continue button')
    }

    // Wait for generic payment provider modal
    console.log('Waiting for payment provider selection...')
    await page.waitForXPath("//button[contains(., 'AzamPay')]", { timeout: 5000 })
    
    // Listen to alerts or handle manually
    page.on('dialog', async dialog => {
      console.log('DIALOG OPENED:', dialog.message())
      await dialog.accept()
    })

    console.log('Selecting AzamPay...')
    const azamBtn = await page.$x("//button[contains(., 'AzamPay')]")
    if (azamBtn.length > 0) {
      await Promise.all([
        (azamBtn[0] as any).click(),
        page.waitForResponse(response => response.url().includes('functions/v1/azampay-checkout'), { timeout: 10000 })
      ]).then(async ([_, response]) => {
        console.log('API Response Status:', response.status())
        console.log('API Response Body:', await response.text())
      }).catch(err => {
        console.log('Wait response failed:', err.message)
      })
    } else {
      throw new Error('Could not find AzamPay button')
    }

    // Wait a couple seconds to catch any dialogs
    await new Promise(r => setTimeout(r, 2000))
    console.log('Test completed.')

  } catch (err) {
    console.error('Test failed:', err)
  } finally {
    await browser.close()
  }
}

tryDeposit()
