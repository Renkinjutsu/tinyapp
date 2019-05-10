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


const users = 
{
  'unique': 
  {
    id: 'unique',
    email: 'test@test.com',
    password: '$2b$10$fsNcpseHrq05MEMkKZxFxu8weqldggJoPuv4x4PAT76BmIh5VHBEK'
  }
}
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
    if (users[uid].email === email && bcrypt.compareSync(password, users[uid].password))
    {
      return uid;
    } 
  }
  return false;
}

const urlsForUser = function(id)
{
  const newDatabase = {}
  for (let short in urlDatabase) 
  {
    if (urlDatabase[short].userId === id) 
    {
      newDatabase[short] = urlDatabase[short]
    }
  }
  return newDatabase;
} 

// counting function
let count = 0 
const countOne = function() {
  return count++;
}

// looping function to add visitors to database
const addVisitor = function(visitor, database, shortURL) 
{
  let persons = urlDatabase[shortURL].visits[1]
  let match = false
  for (let id in persons)
  {
    console.log("this is the database: ", id)
    console.log("this is the anon visitor: ", visitor)

    if (id === visitor)
    {
      match = true;
    }
  }
  if (!match) 
  {
    urlDatabase[shortURL].visits[1][visitor] = new Date()
  }
  console.log(urlDatabase[shortURL].visits[1])
}
// ROOT page
app.get('/', function(req, res) 
{
  console.log(req.session.userId)
  if (req.session.userId) 
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
  if (req.session.userId) 
  {
    res.redirect('/urls')
  } else 
  {
    res.render('login');
  }
})
app.post('/login', (req, res) =>
{
  const user = req.body.email;
  const password = req.body.password;
  const uid = returnId(user, password);
  console.log(returnId(user, password))
  if (uid) 
  {
    console.log(uid)
    req.session.userId = uid
    res.redirect('/urls')
  } else 
  {
    res.redirect('/error')
  }
})

// LOGOUT route
app.post('/logout', (req, res) =>
{
  req.session = null;
  res.redirect('/urls')
})

// Login Error page
app.get('/error', (req, res) =>
{
  res.render('error')
})

// REGISTER page
app.get('/register', (req, res) =>
{
  if (req.session.userId) 
  {
    res.redirect('/urls')
  } else
  {
  res.render('register');
  }
});

app.post('/register', (req, res) =>
{
  const user = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  const uid = generateRandomString();
  console.log(returnId(user, password))
  if (!user || !password) 
  {
    res.redirect('/error')
  } else if (returnId(user, req.body.password)) 
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
    req.session.userId = uid
    res.redirect('/urls');
  }
});


// url INDEX
app.get('/urls', (req, res) => 
{
  const userId = req.session.userId;
  const userObj = users[userId];
  let templateVars = 
  { 
    user: userObj,
    urls: urlsForUser(userId)
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => 
{
  const newShortUrl = generateRandomString();
  const userId = req.session.userId;
  if (req.body) {
    urlDatabase[newShortUrl] = 
    {
      longURL: req.body.longURL,
      userId: userId,
      date: new Date()
    }
  }
  console.log(urlDatabase)
  res.redirect(`/urls/${newShortUrl}`)
})


// page to create NEW short url 
app.get('/urls/new', (req, res) => 
{
  const userId = req.session.userId;
  if (!userId) 
  {
    res.redirect('/login');
  } else
  {
    const userObj = users[userId];
    let templateVars = 
    { 
      user: userObj,
      urls: urlDatabase
    };
  res.render('urls_new', templateVars);
  }
});

// url/shortURL EDIT from url show
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.session.userId;
  const id = req.params.shortURL;
  const newLongURL = req.body.newURL;
  if (urlDatabase[id].userId === userId) 
  {
  urlDatabase[id].longURL = newLongURL; 
  res.redirect('/urls');
  } else
  {
    res.redirect('/error')
  }
});

// Render UNIQUE shorturl
app.get("/urls/:shortURL", (req, res) => 
{
  const userId = req.session.userId;
  console.log('cookies?', req.session.json)
  if (!userId) 
  {
    res.redirect('/error')
  } else
  {
    const short = req.params.shortURL
    const long = urlDatabase[req.params.shortURL].longURL
    const date = urlDatabase[req.params.shortURL].date
    const userObj = users[userId];
    let templateVars = 
    { 
      user: userObj,
      shortURL: short,
      longURL: long,
      date: date.toString(),
      visits:  urlDatabase[short].visits

    };

    // logging visits
    // access urldatabase visits
    console.log(urlDatabase[short].visits);
    
    // log unique visit + date
    console.log('true then false', req.session.views)

    req.session.views = 'new';
    res.render("urls_show", templateVars);
  }
});

// Deleting url route
app.post('/urls/:shortURL/delete', (req, res) => 
{
  const userId = req.session.userId;
  const databaseKey = req.params.shortURL
  if (urlDatabase[databaseKey].userId === userId) 
  {
  delete urlDatabase[databaseKey]
  res.redirect('/urls')
  } else 
  {
    res.redirect('/error')
  }
 
});

// REDIRECT EXTERNAL url
app.get("/u/:shortURL", (req, res) => 
{
  let userId = req.session.userId;
  const short = req.params.shortURL
  let urlDatabaseURL = urlDatabase[short].longURL
  console.log(urlDatabase[short].visits)
  console.log(urlDatabase[short].visits[1])
  if (!userId) {
    userId = `anon${countOne()}`
    urlDatabase[short].visits[0] += 1;
    addVisitor(userId, urlDatabase, short)
    console.log(userId)
    res.redirect(urlDatabaseURL)
  } else if (urlDatabase[short]) 
  {
  urlDatabase[short].visits[0] += 1; //increase visits
  addVisitor(userId, urlDatabase, short)
  console.log('should increase', urlDatabase[short].visits);
  res.redirect(urlDatabaseURL)
  } else 
  {
    res.send('404: Link or page not found')
  }
});

// arbitrary page
app.get('/:anythingelse', (req, res) =>
{
  res.redirect('/error')
})

app.listen(PORT, () => 
{
  console.log(`Example app listening on port ${PORT}!`);
});