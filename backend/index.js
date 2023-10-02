const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://play.google.com/store/apps/details?id=com.spbtv.mobilinktv');

  // Wait for the element with itemprop="name" to appear in the DOM
  await page.waitForSelector('[itemprop="name"]');

  // Find the text content of the child <span> element within the found element
  const spanText = await page.evaluate(() => {
    const element = document.querySelector('[itemprop="name"]');
    const spanElement = element.querySelector('span');
    return spanElement.textContent;
  });

   // Find the text content of the child <span> element within the <a> tag
   const spanText2 = await page.evaluate(() => {
    const element = document.querySelector('.Vbfug.auoIOc a span');
    return element.textContent;
  });

   // Get the src attribute of the element with itemprop="image"
   const srcAttribute = await page.evaluate(() => {
    const element = document.querySelector('[itemprop="image"]');
    return element.getAttribute('src');
  });

  // Get the text content of the element with class "xg1aie"
  const divText = await page.evaluate(() => {
    const element = document.querySelector('.xg1aie');
    return element.textContent;
  });

  // Evaluate the page to find and filter the desired elements
  const result = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('.ClM7O'));
    const filteredDivs = divs.filter((div) => {
      const siblingDiv = div.nextElementSibling;
      return siblingDiv && siblingDiv.textContent.trim() === 'Downloads';
    });
    return filteredDivs.map((div) => div.textContent.trim());
  });

  console.log("Text content of 'ClM7O' divs with 'Downloads':");
  result.forEach((text) => {
    console.log(text);
  });

  // Evaluate the page to find and filter the desired elements
  const result2 = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('.Si6A0c.RrSxVb'));
    return elements.map((element)=> {
      const href = element.getAttribute('href')
      const ariaLabel = element.getAttribute('aria-label')
      return {ariaLabel,href}
    })
  });

  console.log("Elements with aria-label containing 'website' and their href attributes:");
  console.log(result2);

  console.log("Text content of the element with class 'xg1aie': " + divText);

  console.log("src attribute of the element with itemprop='image': " + srcAttribute);

  console.log("Text within <span> inside <a> inside element with class 'Vbfug auoIOc': " + spanText2);


  console.log("Text within <span> inside element with itemprop='name': " + spanText);

  await browser.close();
})();
