const faker = require('faker')
const randomstring = require('randomstring')
const bcrypt = require('bcrypt')

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('user')
  .insert({
    id: 'fast',
    password: bcrypt.hashSync('campus', 10)
  })
  .then(() => {
    const arr = []
    for (var i = 0; i < 20; i++) {
      arr.push(
        knex('url_entry')
          .insert({
            id: randomstring.generate(8),
            long_url: faker.internet.url(),
            user_id: 'fast'
          }).then(console.log)
      )
    }

    return Promise.all(arr)
  })
  // promise가 감싸고 있는 값이 밑의 then에 들어간다.
  // .then(value => {})
};

