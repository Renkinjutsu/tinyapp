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
    id: 'test',
    email: 'test@test.com',
    password: 'test'
  }
}
const urlDatabase = 
{
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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



// index page
app.get('/', function(req, res) 
{
//  if logged in send to index, if not send to login
});


// LOGIN header route
app.get('/login', (req,res) =>
{
  res.render('login');
})
app.post('/login', (req, res) =>
{
  // need to verify login and password and send user cookie
  const user = req.body.email;
  const password = req.body.password;
  const uid = returnId(user, password);
  // const userName = req.body.username; //user id instead
  res.cookie('userId', uid)
  res.redirect('/urls')
})

// LOGOUT route
app.post('/logout', (req, res) =>
{
  const userName = req.body.username
  res.clearCookie('username')
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
    // redirect to login
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
  const username = req.cookies['username']; //change to user id
  
  let templateVars = 
  { 
    username: username,
    userId: 'input user',
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => 
{
  let newShortUrl = generateRandomString()
  if (req.body) {
    urlDatabase[newShortUrl] = req.body.longURL;
  }
  res.redirect(`/urls/${newShortUrl}`)
})


// create NEW short url 
app.get('/urls/new', (req, res) => 
{
  res.render('urls_new');
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
  const long = urlDatabase[req.params.shortURL]
  const templateVars = { shortURL: short, longURL: long};
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => 
{
  console.log(`Example app listening on port ${PORT}!`);
});