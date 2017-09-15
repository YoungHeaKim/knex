// 빈데이터 베이스에 up을 사용하여 추가하는 방법
exports.up = function(knex, Promise) {
  return knex.schema.createTable('user', t => {
    t.string('id').primary()
    t.string('password').notNullable()
  })
};

// 만약 데이터베이스에 잘못 up을 해주었을 때 down을 해준다.(변경사항 되돌리기)
exports.down = function(knex, Promise) {
  return knex.schema.dropTable('user')
};
