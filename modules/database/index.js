console.time("Module => database");
const mysql = require("mysql2");
const md5 = require("md5");

var sql = mysql.createPool({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   database: process.env.DB_NAME,
   password: process.env.DB_PASSWORD
})

sql.query(`create table if not exists users
   (id int(11) NOT NULL auto_increment primary key,
   login varchar(255) unique NOT NULL,
   password varchar(512) NOT NULL,
   age int(4) default NULL,
   sex bool default NULL,
   firstname varchar(255) NOT NULL,
   lastname varchar(255) default NULL,
   color varchar(8) default "#000000",
   scroll bool default 1,
   admin bool default 0,
   imgStatus bool default 0)
   DEFAULT CHARSET=utf8;`, (err, result) => {
   if (err) console.error(err);
   sql.query(`insert ignore into users (login, password, age, sex, firstname, lastname, admin)
   values ("admin","${md5("admin")}", 18, 1, "Даниил", "Богданов", 1);`, (err, result) => {
      if (err) console.error(err);
      sql.query(`create table if not exists friends
         (id_1 int(11) not null, id_2 int(11) not null)
         DEFAULT CHARSET=utf8;`, (err) => {
         if (err) console.error(err);
         sql.query(`create table if not exists friends_requests
            (from_id int(11) not null, to_id int(11) not null)
            DEFAULT CHARSET=utf8;`, (err) => {
            if (err) console.error(err);
            sql.query(`create table if not exists tokens
               (token varchar(255) not null,
               id int(11) not null,
               login varchar(255) not null,
               time datetime default null)
               DEFAULT CHARSET=utf8;`, (err) => {
               if (err) console.error(err);
               sql.query(`create table if not exists chat
               (id int(11) auto_increment primary key,
               text text,
               user_id int(11) NOT NULL,
               type varchar(255) NOT NULL,
               login varchar(255) NOT NULL,
               color varchar(8) NOT NULL,
               time datetime NOT NULL)
               DEFAULT CHARSET=utf8;`, (err) => {
                  if (err) console.error(err);
                  console.timeEnd("Module => database");
               })
            })
         })
      })
   })
})


exports.query = (a, b) => {
   sql.query(a, b);
}

exports.escape = (s) => {
   return sql.escape(s);
}
