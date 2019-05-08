const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 8080; // default port 8080
app.set('view engine', 'ejs'); //set the view engine to ejs
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let random = '';
  for (let i of [1,2,3,4,5,6]) {
    let num = Math.floor(Math.random() * 99999999)
    let a = num.toString(36)
    random += a[1];
  }
  return random;
} 



// index page
app.get('/', function(req, res) {
  
  var drinks = [
      { name: 'Bloody Mary', drunkness: 3 },
      { name: 'Martini', drunkness: 5 },
      { name: 'Scotch', drunkness: 10 }
  ];
  var tagline = "Any code of your own that you haven't looked at for six or more months might as well have been written by someone else.";

  res.render('pages/index', {
      drinks: drinks,
      tagline: tagline
  })
});


// about page
app.get('/about', function(req, res) {
    res.render('pages/about');
});

// url index
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(req);
  console.log(req.statusCode)
  let newShortUrl = generateRandomString()
  if (req.body) {
    urlDatabase[newShortUrl] = `${req.body.longURL}`
  }
  res.redirect(`/urls/${newShortUrl}`)
})

// url shortener
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// url/shortURL 
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

// hello demo
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});