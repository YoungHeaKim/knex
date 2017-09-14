const express = require('express')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')

const query = require('./query')

const app = express()
const urlencodedMiddleware = bodyParser.urlencoded({ extended: false })

app.use(cookieSession({
  name: 'session',
  keys: ['mysecret']
}))
app.set('view engine', 'ejs')

function authMiddleware(req, res, next) {
  if(req.session.id) {
    query.getUserById(req.session.id)
      .then(matched => {
        req.user = matched
        // 템플릿에서 직접 쓰지 않아도 사용가능한 용어
        res.locals.user = matched
        next()
      })
  } else {
    // login이 되지 않았을 경우 login페이지로 이동 시킨다.
    res.redirect('/login')
  }
}

app.get('/', authMiddleware, (req, res) => {
  query.getUrlEntriesByUserId(req.user.id)
    .then(rows => {
      res.render('index.ejs', {rows})
    })
})

app.get('/login', (req, res) => {
  res.render('login.ejs')
})

app.post('/login', urlencodedMiddleware, (req, res) => {
  query.getUser(req.body.username, req.body.password)
    .then(matched => {
      if(matched) {
        req.session.id = matched.id
        res.redirect('/')
      } else {
        res.status(400)
        res.send('왜안될깡?')
      }
    })
})

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/login')
})

app.listen(3000, () => {
  console.log('listening...')
})
