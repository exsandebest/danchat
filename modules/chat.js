'use strict';
console.time("Module => chat");
const db = require("./database");
let clients = [];


exports.subscribe = function (req, res) {
    clients.push(res);
    res.on("close", function () {
        clients.splice(clients.indexOf(res), 1);
    });
};

exports.addNewMessage = function (msg) {
    db.addMessage(msg).then((messageId) => {
        msg.id = messageId;
        delete msg["user_id"];
        let dateString = new Date().toLocaleString("ru-RU", {timeZone: "Europe/Moscow"});
        msg.date = `${dateString.split(", ")[0]}`;
        msg.time = `${dateString.split(", ")[1]}`;
        clients.forEach((res) => {
            res.send(JSON.stringify(msg));
        });
        clients = [];
    }, (err) => {
        console.error(err);
    })


};
console.timeEnd("Module => chat");
