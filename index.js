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

AWS.config.credentials = new AWS.EC2MetadataCredentials({
  httpOptions: { timeout: 5000 }
  });

const s3 = new AWS.S3();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  const dynamoParams = {
    TableName: 'movies'
  };

  dynamoDb.scan(dynamoParams, (error, data) => {
    if (error) {
      console.error(error);
      res.status(400).send({ error: 'Could not fetch items from DynamoDB' });
    } else {
      const s3Params = { Bucket: 'mediasharingapp', MaxKeys: 100 };
      s3.listObjectsV2(s3Params, function (err, s3Data) {
        if (err) {
          console.log(err, err.stack);
          res.status(400).send({ error: 'Could not fetch images from S3' });
        } else {
          const images = s3Data.Contents.filter(function (item) {
            return item.Key.match(/\.(jpg|jpeg|png|gif)$/);
          });
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', 0);
          res.render('index', { data: data.Items, images: images, params: s3Params });
        }
      });
    }
  });
});


app.get('/new', (req, res) => {
  res.render('new');
});


const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.post('/create', upload.single('image'), (req, res) => {
  req.body.EIB = uuid.v4();
  const fileContent = fs.readFileSync(req.file.path);
  const s3Params = {
    Bucket: 'mediasharingapp',
    Key: req.file.originalname,
    Body: fileContent
  };
  s3.upload(s3Params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(`File uploaded successfully. ${data.Location}`);
    }
  });

  const dynamoDbParams = {
    TableName: 'movies',
    Item: {
      EIB: req.body.EIB,
      Title: req.body.Title,
      Description: req.body.Description,
      Tags: req.body.Tags,
      Image: req.file.originalname
    }
  };

  dynamoDb.put(dynamoDbParams, (error) => {
    if (error) {
      console.error(error);
      res.status(400).send({ error: 'Could not create item' });
    } else {
      setTimeout(() => {
        res.redirect('/');
      }, 2000);
    }
  });
});


app.get('/update/:id', (req, res) => {
  const id = req.params.id;
  const params = {
    TableName: 'movies',
    Key: {
      'id': id
    }
  };
  dynamoDb.get(params, (err, data) => {
    if (err) {
      console.log('Error: ', err);
    } else {
      const item = data.Item;
      res.render('update', { title: 'Update Media Item', item: item });
    }
  });
});

app.post('/update/:id', upload.single('Image'), (req, res) => {
  const id = req.params.id;
  const title = req.body.Title;
  const description = req.body.Description;
  const tags = req.body.Tags;
  let image = '';

  // Upload image to S3 if it exists
  if (req.file) {
    const fileContent = fs.readFileSync(req.file.path);
    const params = {
      Bucket: 'mediasharingapp',
      Key: req.file.originalname,
      Body: fileContent,
      ACL: 'public-read'
    };
    s3.upload(params, (err, data) => {
      if (err) {
        console.log('Error: ', err);
      } else {
        image = data.Key;
      }
    });
  }

  // Update item in DynamoDB
  const params = {
    TableName: 'movies',
    Key: {
      'id': id
    },
    UpdateExpression: 'set Title = :title, Description = :description, Tags = :tags' + (image ? ', Image = :image' : ''),
    ExpressionAttributeValues: {
      ':title': title,
      ':description': description,
      ':tags': tags
    }
  };

  if (image) {
    params.ExpressionAttributeValues[':image'] = image;
  }

  dynamoDb.update(params, (err, data) => {
    if (err) {
      console.log('Error: ', err);
    } else {
      console.log('Item updated successfully!');
      res.redirect('/');
    }
  });
});


app.get('/delete/:id', (req, res) => {
  const id = req.params.id;
  // Add code to delete data from your database
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
