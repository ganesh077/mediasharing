const express = require('express');
const AWS = require('aws-sdk');
const uuid = require('uuid');
const app = express();
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// Set up AWS credentials and region
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

// Set up S3 bucket name
const bucketName = 'mediasharingapp';

// Route to retrieve all items from S3 bucket and render them in the web page
app.get('/', (req, res) => {
  s3.listObjectsV2({ Bucket: bucketName }, (err, data) => {
    if (err) {
      console.log(`Error getting objects from S3 bucket: ${err}`);
      res.status(500).send('Error getting objects from S3 bucket');
    } else {
      let images = data.Contents.map(obj => {
        let key = obj.Key;
        let url = s3.getSignedUrl('getObject', { Bucket: bucketName, Key: key });
        return { key: key, url: url };
      });
      res.render('index', { images: images });
    }
  });
});

// Route to render form to upload new image
app.get('/new', (req, res) => {
  res.render('new');
});

// Route to handle form submission and upload new image to S3 bucket
app.post('/create', (req, res) => {
  let file = req.files.image;
  let key = uuid.v4() + '-' + file.name;
  let params = { Bucket: bucketName, Key: key, Body: file.data };
  s3.upload(params, (err, data) => {
    if (err) {
      console.log(`Error uploading object to S3 bucket: ${err}`);
      res.status(500).send('Error uploading object to S3 bucket');
    } else {
      console.log(`Object uploaded to S3 bucket: ${data.Location}`);
      res.redirect('/');
    }
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
