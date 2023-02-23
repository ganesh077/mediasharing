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
  // Add code to fetch the data for the specific media item from your database
  const item = {}; // Replace with the fetched data
  res.render('update', { title: 'Update Media Item', item: item });
});

app.put('/update/:id', async (req, res) => {
  const id = req.params.id;
  const title = req.body.Title;
  const description = req.body.Description;
  const tags = req.body.Tags;

  // Check if an image was uploaded
  let image = req.body.Image;
  if (req.file) {
    image = req.file.filename;
  }

  try {
    // Update the item in the DynamoDB table
    const params = {
      TableName: "movies",
      Key: {
        id: id,
      },
      UpdateExpression: 'set #t = :t, #d = :d, #g = :g, #i = :i',
      ExpressionAttributeNames: {
        '#t': 'Title',
        '#d': 'Description',
        '#g': 'Tags',
        '#i': 'Image',
      },
      ExpressionAttributeValues: {
        ':t': title,
        ':d': description,
        ':g': tags,
        ':i': image,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const result = await docClient.update(params).promise();
    console.log('Updated item:', result);

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while updating the item.');
  }
});


app.get('/delete/:id', (req, res) => {
  const id = req.params.id;
  // Add code to delete data from your database
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
