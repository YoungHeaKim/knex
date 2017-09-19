const express = require('express')
const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const flash = require('connect-flash')
const csurf = require('csurf')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const query = require('./query')

const app = express()
const urlencodedMiddleware = bodyParser.urlencoded({ extended: false })
const csrfMiddleware = csurf()

app.use(cookieSession({
  name: 'session',
  keys: ['mysecret']
}))
app.use(urlencodedMiddleware)
app.use(csrfMiddleware)
app.use(flash())
app.set('view engine', 'ejs')

app.use(passport.initialize())
// JWT를 사용시 밑에 session은 필요없다.
app.use(passport.session())

// 객체로부터 문자열을 빼내는 방법
passport.serializeUser((user, done) => {
  // user 객체로부터 세션에 저장할 수 있는 문자열을 만들어 반환
  // done의 사용법은 밑에와 같다.
  done(null, user.id)
})

// 지속적으로 user를 가져오고 싶을 때 사용
passport.deserializeUser((id, done) => {
  // 세션에 저장되어 있는 id를 통해 user 객체를 얻어온 후 반환
  query.getUserById(id)
    .then(user => {
      if(user) {
        done(null, user)
      } else {
        done(new Error('아이디가 일치하는 사용자가 없습니다.'))
      }
    })
})

// 최초의 로그인을 시킬 때 username과 password를 비교하여 있으면 done으로 객체로 넘겨준다.
passport.use(new LocalStrategy((username, password, done) => {
  query.getUserById(req.body.username)
    .then(matched => {
      if(matched && bcrypt.compareSync(matched.password)) {
        // login을 시켜주는 처리
        done(null, matched)
      } else {
        // 로그인을 시켜주지 않는 처리
        // 보안을 강화시키기 위해 둘중 하나가 틀려도 둘다 틀렸다고 알려주는 것을 좋다.
        done(new Error('사용자 이름 혹은 비밀번호가 일치하지 않습니다.'))
      }
    })
}))

// 로그인이 되어있으면 통과시키고 안되있으면 로그인페이지로 되돌아가게 만들어 주는 역할
function authMiddleware(req, res, next) {
  if(req.user) {
    // 로그인이 된 상태이므로 그냥 통과시킨다.
    next()
  } else {
    res.redirect('/login')
  }
}

app.get('/', authMiddleware, (req, res) => {
  query.getUrlEntriesByUserId(req.user.id)
    .then(rows => {
      res.render('index.ejs', {rows, csrfToken: req.csrfToken()})
    })
})

app.get('/login', (req, res) => {
  res.render('login.ejs', {errors: req.flash('error'), csrfToken: req.csrfToken()})
})

app.post('/login', (req, res) => {
  query.getUserById(req.body.username)
    .then(matched => {
      if(matched && bcrypt.compareSync(req.body.password, matched.password)) {
        req.session.id = matched.id
        res.redirect('/')
      } else {
        // session에 정보를 저장함
        req.flash('error', '아이디 혹은 비밀번호가 일치하지 않습니다.')
        res.redirect('/login')
      }
    })
})

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/login')
})

// URL입력을 받는 부분
app.post('/url_entry', authMiddleware, (req, res) => {
  const long_url = req.body.long_url
  // 데이터 저장
  query.createUrlEntry(long_url, req.user.id)
    .then(() => {
      res.redirect('/')
    })
    .catch(err => {
      req.flash('error', '올바른 URL이 아닙니다.')
      res.redirect('/')
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
  res.render('register.ejs', {csrfToken: req.csrfToken()})
})

app.post('/register', (req, res) => {
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
