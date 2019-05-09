const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 8080;
const cookieParser = require('cookie-parser');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const users = 
{
  'unique': 
  {
    id: 'unique',
    email: 'test@test.com',
    password: 'test'
  }
}
const urlDatabase = 
{
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userId: 'unique'},
  "9sm5xK": {longURL: "http://www.google.com", userId: 'unique'}
};

const generateRandomString = function() 
{
  let random = '';
  for (let i of [1,2,3,4,5,6]) 
  {
    let num = Math.floor(Math.random() * 99999999)
    let a = num.toString(36)
    random += a[1];
  }
  return random;
}; 

const returnId = function(email, password)
{
  for (let uid in users) 
  {
    if (users[uid].email === email && users[uid].password === password)
    {
      return uid;
    } 
  }
  return false;
}



// ROOT page
app.get('/', function(req, res) 
{
  if (req.cookies.userId) 
  {
    res.redirect('/urls')
  } else 
  {
    res.redirect('/login')
  }
});
// GUCCI

// LOGIN PAGE
app.get('/login', (req,res) =>
{
  res.render('login');
})
app.post('/login', (req, res) =>
{
  const user = req.body.email;
  const password = req.body.password;
  const uid = returnId(user, password);
  if (uid) 
  {
    res.cookie('userId', uid)
    res.redirect('/urls')
  } else {
    res.send('403: Please login or register')
  }
  // const userName = req.body.username; //user id instead
  res.cookie('userId', uid)
  res.redirect('/urls')
})

// LOGOUT route
app.post('/logout', (req, res) =>
{
  res.clearCookie('userId')
  res.redirect('/urls')
})

// REGISTER page
app.get('/register', (req, res) =>
{
  res.render('register');
});

app.post('/register', (req, res) =>
{
  const user = req.body.email;
  const password = req.body.password;
  const uid = generateRandomString();
  // console.log('this should be false: ', !(user && password) )
  // console.log('also false: ', !returnId(user, password))
  if (!(user && password)) 
  {
    res.send('400\nPlease entire valid email and password')
  } else if (returnId(user, password)) 
  {
    res.redirect('/login')
  } else 
  {
    users[uid] = 
    {
      id: uid,
      email: user,
      password: password
    };
    console.log(users)
    res.redirect('/urls');
  }
});


// url INDEX
app.get('/urls', (req, res) => 
{
  const userId = req.cookies['userId'];
  const userObj = users[userId];
  let templateVars = 
  { 
    user: userObj,
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => 
{
  const newShortUrl = generateRandomString();
  const userId = req.cookies['userId'];
  if (req.body) {
    urlDatabase[newShortUrl] = 
    {
      longURL: req.body.longURL,
      userID: userId
    }
  }
  // console.log(urlDatabase) TEST
  res.redirect(`/urls/${newShortUrl}`)
})


// create NEW short url 
app.get('/urls/new', (req, res) => 
{
  const userId = req.cookies['userId'];
  const userObj = users[userId];
  let templateVars = 
  { 
    user: userObj,
    urls: urlDatabase
  };

  if (userId) 
  {
  res.render('urls_new', templateVars);
  } else 
  {
    res.redirect('/login');
  }
});

// REDIRECT EXTERNAL url
app.get("/u/:shortURL", (req, res) => 
{
  const urlDatabaseURL = urlDatabase[req.params.shortURL]
  res.redirect(urlDatabaseURL)
});

// Deleting url route
app.post('/urls/:shortURL/delete', (req, res) => 
{
  const databaseKey = urlDatabase[req.params.shortURL]
  delete databaseKey
  res.redirect('/urls')
});

// url/shortURL 
app.post('/urls/:shortURL', (req, res) => {
  const id = req.params.shortURL;
  const newLongURL = req.body.newURL;
  urlDatabase[id] = newLongURL; 
  res.redirect('/urls');
});

// Render UNIQUE shorturl
app.get("/urls/:shortURL", (req, res) => 
{
  const short = req.params.shortURL
  const long = urlDatabase[req.params.shortURL].longURL
  const userId = req.cookies['userId'];
  const userObj = users[userId];
  let templateVars = 
  { 
    user: userObj,
    shortURL: short,
    longURL: long
  };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => 
{
  console.log(`Example app listening on port ${PORT}!`);
});