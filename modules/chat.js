'use strict';
console.time("Module => chat");
const sql = require("./database");
let clients = [];


exports.subscribe = function(req, res) {
    clients.push(res);
    res.on("close", function() {
        clients.splice(clients.indexOf(res), 1);
    });
};

exports.addnewmessage = function(msg) {
    sql.query(`insert into chat (text, user_id, login, color, type, time) values (${sql.escape(msg.text)},
    ${sql.escape(msg.user_id)}, ${sql.escape(msg.login)}, ${sql.escape(msg.color)} ,${sql.escape(msg.type)}, NOW())`, (err, data) => {
        if (err) console.error(err);
        sql.query(`select time from chat where id = ${sql.escape(data.insertId)}`, (err, dt) => {
            delete msg["user_id"];
            let date = new Date(dt[0].time);
            msg.date = `${String(date.getDate()).padStart(2,"0")}.${String(date.getMonth() + 1).padStart(2,"0")}.${date.getFullYear()}`;
            msg.time = `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}:${String(date.getSeconds()).padStart(2,"0")}`;
            clients.forEach((res) => {
                res.send(JSON.stringify(msg));
            });
            clients = [];
        })
    })
};
console.timeEnd("Module => chat");
