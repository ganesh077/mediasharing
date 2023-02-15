const express = require('express');
const app = express();
const port = 3000;
const uuid = require('uuid');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

AWS.config.update({
  region: 'us-east-1',
});

const s3 = new AWS.S3();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  const params = { Bucket: 'mediasharingapp', MaxKeys: 100 };
  s3.listObjectsV2(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      const images = data.Contents.filter(function (item) {
        return item.Key.match(/\.(jpg|jpeg|png|gif)$/);
      });
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', 0);
      res.render('index', { images: images, params: params });
    }
  });
});

app.get('/new', (req, res) => {
  res.render('new');
});

app.post('/create', upload.single('image'), (req, res) => {
  req.body.EIB = uuid.v4();
  const fileContent = fs.readFileSync(req.file.path);
  const params = {
    Bucket: 'mediasharingapp',
    Key: req.file.originalname,
    Body: fileContent
  };
  s3.upload(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(`File uploaded successfully. ${data.Location}`);
    }
  });
  // Add code to save data to your database
  setTimeout(() => {
    res.redirect('/');
  }, 3000);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
