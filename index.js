const express = require('express');
const app = express();
const port = 3000;
const uuid = require('uuid');
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-west-2',
});

const s3 = new AWS.S3();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  const params = { Bucket: 'your-bucket-name', MaxKeys: 100 };
  s3.listObjectsV2(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
    } else {
      const images = data.Contents.filter(function (item) {
        return item.Key.match(/\.(jpg|jpeg|png|gif)$/);
      });
      res.render('index', { images: images });
    }
  });
});

app.get('/new', (req, res) => {
  res.render('new');
});

app.post('/create', (req, res) => {
  req.body.EIB = uuid.v4();
  // Add code to save data to your database
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
