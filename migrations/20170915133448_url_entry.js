
exports.up = function(knex, Promise) {
  'url_entry', t => {
    t.string('id', 8).primary()
    t.string('long_url').notNullable()
    t.string('user_id')
    t.foreign('user_id').references('user_id')
    t.timestamp('created_at').defaultTo(knex.fn.now())
  }
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('url_entry')
};