console.time("Module => chat");
const fs = require("fs");
const sql = require("../database");
var clients = [];


exports.subscribe = function(req, res) {
   clients.push(res);
   res.on("close", function() {
      clients.splice(clients.indexOf(res), 1);
   });
};

exports.addnewmessage = function(msg) {
   sql.query(`insert into chat (text, user_id, login, color, type, time) values (${sql.escape(msg.text)},
    ${sql.escape(msg.user_id)}, ${sql.escape(msg.login)}, ${sql.escape(msg.color)} ,${sql.escape(msg.type)}, ${sql.escape(msg.time)})`, (err) => {
      if (err) console.error(err);
      sql.query(`insert into chathistory (login, text) values (${sql.escape(msg.login)},
       ${sql.escape((msg.type === "exit"?"покинул(а) чат":(msg.type === "enter"?"вошел(ла) в чат":msg.text)))})`, (err)=>{
         if (err) console.error(err);
         delete msg["user_id"];
         clients.forEach((res) => {
            res.send(JSON.stringify(msg))
         });
         clients = [];
      })
   })

};
console.timeEnd("Module => chat");
