console.time("Module => chat");
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
    ${sql.escape(msg.user_id)}, ${sql.escape(msg.login)}, ${sql.escape(msg.color)} ,${sql.escape(msg.type)}, NOW())`, (err) => {
      if (err) console.error(err);
         delete msg["user_id"];
         clients.forEach((res) => {
            res.send(JSON.stringify(msg));
         });
         clients = [];
   })
};
console.timeEnd("Module => chat");
