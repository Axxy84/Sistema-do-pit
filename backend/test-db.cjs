const db = require('./config/db.cjs');

db.query('SELECT NOW()')
  .then(res => {
    console.log('Hora atual do PostgreSQL:', res.rows[0]);
    db.end();
  })
  .catch(err => {
    console.error('Erro ao consultar o banco:', err);
    db.end();
  });
