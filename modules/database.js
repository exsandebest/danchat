'use strict';
console.time("Module => database");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const saltRounds = 3;

const sql = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
})

sql.query(`create table if not exists users
   (id int(11) NOT NULL auto_increment primary key,
   login varchar(255) unique NOT NULL,
   password varchar(512) NOT NULL,
   birthdate datetime NOT NULL,
   sex bool default NULL,
   firstname varchar(255) NOT NULL,
   lastname varchar(255) default NULL,
   color varchar(8) default '#000000',
   admin bool default 0,
   img_status bool default 0)
   DEFAULT CHARSET=utf8;`, (err, result) => {
    if (err) console.error(err);
    sql.query(`insert ignore into users (login, password, birthdate, sex, firstname, lastname, admin)
   values ("admin", ${sql.escape(bcrypt.hashSync("admin", saltRounds))}, NOW() - INTERVAL 18 YEAR , 1, 'Администратор', '', 1);`, (err, result) => {
        if (err) console.error(err);
        sql.query(`create table if not exists friends
         (id_1 int(11) not null, id_2 int(11) not null)
         DEFAULT CHARSET=utf8;`, (err) => {
            if (err) console.error(err);
            sql.query(`create table if not exists friends_requests
            (id_from int(11) not null, id_to int(11) not null)
            DEFAULT CHARSET=utf8;`, (err) => {
                if (err) console.error(err);
                sql.query(`create table if not exists tokens
               (token varchar(255) not null,
               user_id int(11) not null,
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
                        sql.query("update users set img_status = 0", (err) => {
                            if (err) console.error(err);
                            console.timeEnd("Module => database");
                        })
                    })
                })
            })
        })
    })
})


exports.query = (query, callback) => {
    sql.query(query, callback);
}

exports.escape = (s) => {
    return sql.escape(s);
}
