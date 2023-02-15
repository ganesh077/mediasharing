const express = require('express');
const app = express();
const port = 3000;
const uuid = require('uuid');
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
var localStorage = require('local-storage');

app.get('/', (req, res) => {
    let data = [{ EIB: '4fc978c6-7835-4094-960b-723b02fc1d8f', Title: 'Freedom', Description: '"Never Back Down" is a martial arts drama that follows the story of a teenager who moves to a new town and becomes involved in an underground mixed martial arts fight club', Tags: 'Martial Arts,Drama', Image: 'image1.jpg' },
                { EIB: '7007beda-c1d3-457b-bb6f-b33d97b2183d', Title: 'Dune', Description: 'The movie is set in the distant future and follows the journey of a young man named Paul Atreides as he becomes embroiled in a power struggle for control of the desert planet Arrakis, also known as Dune.', Tags: 'Science Fiction, Adventure', Image: 'image2.jpg' }];
    if (localStorage.get('newData')) {
      data = data.concat(JSON.parse(localStorage.get('newData')));
    }
    res.render('index', { data: data });
  });

app.get('/new', (req, res) => {
  res.render('new');
});

app.post('/create', (req, res) => {
    req.body.EIB = uuid.v4();
    let newData = [];
    if (localStorage.get('newData')) {
      newData = JSON.parse(localStorage.get('newData'));
    }
    newData.push(req.body);
    localStorage.set('newData', JSON.stringify(newData));
    res.redirect('/');
  });
  

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
