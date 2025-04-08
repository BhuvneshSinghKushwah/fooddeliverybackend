const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.db_host,
  port: process.env.db_port,
  user: process.env.db_username,
  password: process.env.db_password,
  database: process.env.db_name,
  connectionLimit: 10,
  timezone: 'Z',
});

pool.on('error', (err) => {
  console.log(err);
})


function conn() {
  let getConnection = new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) reject(err);
      else resolve(connection);
    });
  });
  return getConnection;
}

module.exports = { conn };
