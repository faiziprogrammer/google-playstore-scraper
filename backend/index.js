const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5000; // Set your desired port number
require("dotenv").config();

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { MongoClient } = require('mongodb');

// Replace 'your_connection_string' with your actual MongoDB Atlas connection string
const uri = 'mongodb+srv://playstore-db:LwRTgOGnZ9iRtgvG@cluster0.jbi6rj9.mongodb.net/?retryWrites=true&w=majority';

// Create a new MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to the MongoDB Atlas cluster
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to the database');



  } catch (error) {
    console.error('Error connecting to the database', error);
  }
}

connectToDatabase();

app.post("/edit", async (req,res)=>{
  try{
    const appCollection = client.db('web-data').collection('totalAppData');
    await appCollection.findOneAndReplace({link:req.body.link},req.body)
    res.status(200)
  }catch(error){
    console.log(error)
    res.status(400)
  }
  
})

app.post("/delete", async (req,res)=>{
  try{
    const appCollection = client.db('web-data').collection('totalAppData');
    await appCollection.findOneAndDelete({link:req.body.link})
    res.status(200)
  }catch(error){
    console.log(error)
    res.status(400)
  }
  
})

app.post("/create", async (req,res)=>{
  try{
    const appCollection = client.db('web-data').collection('totalAppData');
    await appCollection.insertOne(req.body);
    res.status(200).send("Successful")
  }catch(error){
    console.log(error)
    res.status(400).send("Unsuccessful")
  }
  
})


app.get("/getDatabase", async (req,res) => {
  const collectionArray = await client.db('web-data').collection('totalAppData').find({}).toArray();
  res.send(collectionArray)
})

app.post("/postApps",async (req,res)=> {
  try {

    const appCollection = client.db('web-data').collection('totalAppData');

    // Delete all documents in the collection
    await appCollection.deleteMany({});

    await appCollection.insertMany(req.body);
    res.status(200).send({ message: 'Request was successful.' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(400).send({ error: 'Bad request.' });
  }
})

app.get('/getApps', async (req, res) => {
  // Fetch query parameters from the request object
  const params = req.query.link;
  const code = req.query.code;

  const result = await getData(params,code)
  res.send(result)
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});



async function getData (link,code){
  let downloadsData
  let nameData
  let imageUrl
  let developerData
  let lastUpdated
  let websiteData
  let privacyPolicy
  let supportMail

  const browser = await puppeteer.launch({ headless: true,executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : puppeteer.executablePath(),
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ] });
  const page = await browser.newPage();
  
  await page.goto(link);

  try {
    // Wait for the element with itemprop="name" to appear in the DOM

  // await page.waitForSelector('[itemprop="name"]');

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

  result.forEach((text) => {
    downloadsData=text
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

  result2.forEach(item => {
    if (item.ariaLabel.includes('Website')) {
      websiteData = item.href;
    } else if (item.ariaLabel.includes('Privacy Policy')) {
      privacyPolicy = item.href;
    } else if(item.ariaLabel.includes('Support email')) {
      supportMail = item.href;
    }
  });

  lastUpdated = divText

  imageUrl = srcAttribute

  developerData = spanText2

  nameData = spanText

  await browser.close();

  return {
    link:link,
    Name:nameData,
    Image:imageUrl,
    Developer:developerData,
    lastUpdated:lastUpdated,
    downloads:downloadsData,
    website:websiteData,
    privacyPolicy:privacyPolicy,
    supportMail:supportMail,
    Live:"Live",
    code:code,
  }
  }catch(error){
    return {
      link:link,
      Live:"Not Live",
      code:code,
    };
  }

};
