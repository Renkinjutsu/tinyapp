const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 8080;
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
app.use(cookieSession
({
  name: 'session',
  keys: ['lighthouse']
}));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// user database for account names, emails, passwords. Used for user authentication.
const users =
{
  'unique':
  {
    id: 'unique',
    email: 'test@test.com',
    password: '$2b$10$fsNcpseHrq05MEMkKZxFxu8weqldggJoPuv4x4PAT76BmIh5VHBEK'
  }
};

/* URL database, shortened urls as keys, called in index, show page, and url 
redirections. Refer to when post to /urls/new 
*/
const urlDatabase = 
{
  "b2xVn2": 
  {
    longURL: "http://www.lighthouselabs.ca",
    userId: 'unique',
    date: new Date().toString(),
    visits: [0, {'unique': new Date()}]
  },
  "9sm5xK": 
  {
    longURL: "http://www.google.com",
    userId: 'unique',
    date: new Date().toString(),
    visits: [0, {'unique': new Date()}]
  }
};

// function: create random Id keys for new accounts
const generateRandomString = function() 
{
  let random = '';
  for (let i = 0; i < 6; i++) 
  {
    let num = Math.floor(Math.random() * 99999999);
    let a = num.toString(36);
    random += a[1];
  }
  return random;
}; 

// function for logins, compare email and password to database using bcrypt
const returnId = function(email, password)
{
  for (let uid in users) 
  {
    if (users[uid].email === email && bcrypt.compareSync(password, users[uid].password)) //password check
    {
      return uid;
    } 
  }
  return false;
};

// function, filter url database for urls created by logged in user
const urlsForUser = function(id)
{
  const newDatabase = {};
  for (let short in urlDatabase) 
  {
    if (urlDatabase[short].userId === id) 
    {
      newDatabase[short] = urlDatabase[short];
    }
  }
  return newDatabase; //new database only includes logged in user's urls
};

// counting function append to anonymous user names
let count = 0;
const countOne = function() {
  return count++;
};

// looping function, track unique visitors using /u/:shortURL to url database
const addVisitor = function(visitor, shortURL) 
{
  let persons = urlDatabase[shortURL].visits[1];
  let match = false;
  for (let id in persons)
  {
    if (id === visitor)
    {
      match = true;
    }
  }
  if (!match) //unique visit
  {
    urlDatabase[shortURL].visits[1][visitor] = new Date(); //create object with user id and date
  }
};
// ROOT page, redirect to index page or login page, depending on login status
app.get('/', function(req, res) 
{
  const userId = req.session.userId;
  if (Object.keys(users).includes(userId)) //check user id against database
  {
    res.redirect('/urls');
  } else 
  {
    res.redirect('/login');
  }
});

// LOGIN PAGE, take email and password, page will post to /login
app.get('/login', (req,res) =>
{
  const userId = req.session.userId;
  if (Object.keys(users).includes(userId)) //cookies need to match database
  {
    res.redirect('/urls');
  } else 
  {
    res.render('login');
  }
});

// receive login submission, pass to user database to authenticate, and give identifying cookie
app.post('/login', (req, res) =>
{
  const user = req.body.email;
  const password = req.body.password;
  const uid = returnId(user, password);
  if (uid) //requires login to work
  {
    req.session.userId = uid; //issue cookie
    res.redirect('/urls');
  } else 
  {
    res.redirect('/error');
  }
});

// LOGOUT route from header
app.post('/logout', (req, res) =>
{
  req.session = null; //end cookie session
  res.redirect('/urls');
});

// Login Error page for unauthenticated users
app.get('/error', (req, res) =>
{
  res.render('error');
});

// REGISTER page, check user database if user is logged in, then direct to page
app.get('/register', (req, res) =>
{
  const userId = req.session.userId;
  if (Object.keys(users).includes(userId)) //check user id against database
  {
    res.redirect('/urls');
  } else
  {
  res.render('register');
  }
});

/* submission from register page to generated hashed password, unique id and email to database
and give cookie.
*/
app.post('/register', (req, res) =>
{
  const user = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10); //password encrypt
  const uid = generateRandomString();
  if (!user || !password) 
  {
    res.redirect('/error');
  } else if (returnId(user, req.body.password)) 
  {
    res.redirect('/login');
  } else 
  {
    users[uid] = // user database object template
    {
      id: uid,
      email: user,
      password: password
    };
    req.session.userId = uid;
    res.redirect('/urls');
  }
});


// INDEX page, displays user urls otherwise ask user to login
app.get('/urls', (req, res) => 
{
  const userId = req.session.userId;
  const userObj = users[userId];
  let templateVars = //variables fed to index page
  { 
    user: userObj,
    urls: urlsForUser(userId) //filter function for urls belonging to user
  };
  res.render('urls_index', templateVars);
});

// post submission from url_new page, generate short url, date created and template for database 
app.post('/urls', (req, res) => 
{
  const newShortUrl = generateRandomString();
  const userId = req.session.userId;
  if (req.body) {
    urlDatabase[newShortUrl] = // url database object template
    {
      longURL: req.body.longURL,
      userId: userId,
      date: new Date(),
      visits: [0, {}]
    };
  }
  res.redirect(`/urls/${newShortUrl}`);
});


// NEW url page, authenticate user, create page to allow form submission
app.get('/urls/new', (req, res) =>
{
  const userId = req.session.userId;
  if (!Object.keys(users).includes(userId))
  {
    res.redirect('/login');
  } else
  {
    const userObj = users[userId];
    let templateVars = //variables fed to new url page
    { 
      user: userObj,
      urls: urlDatabase
    };
  res.render('urls_new', templateVars);
  }
});

// post from EDIT button in show page, edit new long url to previous short url
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.session.userId;
  const id = req.params.shortURL;
  const newLongURL = req.body.newURL;
  if (urlDatabase[id].userId === userId) //authenticate user
  {
  urlDatabase[id].longURL = newLongURL; //edit old url
  res.redirect('/urls');
  } else
  {
    res.redirect('/error');
  }
});

// Render show page for specific url, authenticate user, show visits, unique visits and time
app.get("/urls/:shortURL", (req, res) => 
{
  const userId = req.session.userId;
  if (!Object.keys(users).includes(userId)) 
  {
    res.redirect('/error');
  } else
  {
    const short = req.params.shortURL;
    const long = urlDatabase[req.params.shortURL].longURL;
    const date = urlDatabase[req.params.shortURL].date;
    const userObj = users[userId];
    let templateVars = //variables fed to show page
    { 
      user: userObj,
      shortURL: short,
      longURL: long,
      date: date.toString(),
      visits:  urlDatabase[short].visits,
      uniqueVisits: Object.keys(urlDatabase[short].visits[1]).length, //count number of users in array
      visitObj: urlDatabase[short].visits[1]
    };
    res.render("urls_show", templateVars);
  }
});
// GUCCI

// Deleting url route
app.post('/urls/:shortURL/delete', (req, res) => 
{
  const userId = req.session.userId;
  const databaseKey = req.params.shortURL;
  if (urlDatabase[databaseKey].userId === userId) //authenticate user
  {
  delete urlDatabase[databaseKey];
  res.redirect('/urls');
  } else 
  {
    res.redirect('/error');
  }
 
});

// redirect short urls to long url, any user may access link
app.get("/u/:shortURL", (req, res) => 
{
  let userId = req.session.userId;
  const short = req.params.shortURL;
  let urlDatabaseURL = urlDatabase[short].longURL;
  if (!Object.keys(users).includes(userId)) {
    userId = `anon${countOne()}`; //generate anonymous id
    urlDatabase[short].visits[0] += 1; //log visits
    addVisitor(userId, short); //log unique visit and user 
    req.session.userId = userId; //issue cookie to user
    res.redirect(urlDatabaseURL);
  } else if (urlDatabase[short]) 
  {
  urlDatabase[short].visits[0] += 1; 
  addVisitor(userId, short);
  res.redirect(urlDatabaseURL);
  } else 
  {
    res.send('404: Link or page not found');
  }
});

// error page to redirect user
app.get('/:anythingelse', (req, res) =>
{
  res.redirect('/error');
})

app.listen(PORT, () => 
{
  console.log(`Example app listening on port ${PORT}!`);
});