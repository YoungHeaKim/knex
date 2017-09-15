const express = require('express')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')

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
  query.getUserById(req.body.username)
    .then(matched => {
      if(matched && bcrypt.compareSync(req.body.password, matched.password)) {
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

// URL입력을 받는 부분
app.post('/url_entry', authMiddleware, urlencodedMiddleware, (req, res) => {
  const long_url = req.body.long_url
  // 데이터 저장
  query.createUrlEntry(long_url, req.user.id)
    .then(() => {
      res.redirect('/')
    })
    .catch(err => {
      res.status(400)
      res.send(err.message)
    })
})

// 짧은 URL사용해서 redirect시킴
app.get('/:id', (req, res, next) => {
  query.getUrlByID(req.params.id)
    .then(entry => {
      if(entry){
        query.incrementClickCountById(entry.id)
          .then(() => {
            res.redirect(entry.long_url)
          })
        // URL을 사용해서 하는 것은 301이 좋지만 302를 사용하여 나중에 조회수를 알아보기위해 302 사용
        res.redirect(entry.long_url)
      } else {
        // 라우트 핸들러를 사용하여 404를 만들 수 있지만 next를 사용하여 나중에 받을 수 있게 만들어놓음
        next()
      }
    })
})

// 회원가입
app.get('/register', (req, res) => {
  res.render('register.ejs')
})

app.post('/register', urlencodedMiddleware, (req, res) => {
  // 계정 정보 저장 후 로그인
  query.createUser(req.body.id, req.body.password)
    .then(() => {
      req.session.id = req.body.id
      res.redirect('/')
    })
})

app.listen(3000, () => {
  console.log('listening...')
})
