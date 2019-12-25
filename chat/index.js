console.time("Module => chat");
const fs = require("fs");
const getter = require('../getter');
var clients = [];


exports.subscribe = function(req, res) {
   clients.push(res);
   res.on("close", function() {
      clients.splice(clients.indexOf(res), 1);
   });
};

exports.addnewmessage = function(action, user) {
   var time = new Date().toTimeString().substring(0,5);
   switch (action) {
      case "message":
         var obj = getObj(user, time);
         obj.text = user.message;
         fs.readFile("data/chat.json", "utf-8", (err, data) => {
            if (data == false) data = "[]";
            var chat = JSON.parse(data);
            chat.push({
               from: obj.from,
               time: time,
               id: obj.id,
               text: user.message
            });
            fs.writeFile("data/chat.json", JSON.stringify(chat, "", 2), (err) => {
               fs.writeFileSync("data/GUID.id", obj.id + 1);
            });
         });
         clients.forEach((res) => {
            res.send(JSON.stringify(obj));
         });
         clients = [];
         fs.appendFile("data/chathistory.txt", `${obj.login}: ${user.message}\n`, function(err) {
            if (err) throw err;
         });
         break;
      case "enter":
         var obj = getObj(user, time);
         obj.type = "enter";

         fs.readFile("data/chat.json", "utf-8", (err, data) => {
            if (data == false) data = "[]";
            var chat = JSON.parse(data);
            chat.push({
               from: obj.from,
               time: time,
               id: obj.id,
               type: "enter"
            });
            fs.writeFile("data/chat.json", JSON.stringify(chat, "", 2), (err) => {
               fs.writeFileSync("data/GUID.id", obj.id + 1);
            });
         });

         clients.forEach((res) => {
            res.send(JSON.stringify(obj))
         });
         clients = [];

         fs.appendFile("data/chathistory.txt", obj.login + " вошел(ла) в чат\n", function(err) {
            if (err) throw err;
         });
         break;
      case "exit":
         var obj = getObj(user, time);
         obj.type = "exit";

         fs.readFile("data/chat.json", "utf-8", (err, data) => {
            if (data == false) data = "[]";
            var chat = JSON.parse(data);
            chat.push({
               from: obj.from,
               time: time,
               id: obj.id,
               type: "exit"
            });
            fs.writeFile("data/chat.json", JSON.stringify(chat, "", 2), (err) => {
               fs.writeFileSync("data/GUID.id", obj.id + 1);
            });
         });

         clients.forEach((res) => {
            res.send(JSON.stringify(obj))
         });
         clients = [];

         fs.appendFile("data/chathistory.txt", obj.login + " покинул(ла) чат\n", function(err) {
            if (err) throw err;
         });
         break;
      default:
         console.log("Action = " + action);
         break;
   }

};


function getObj(user, time) {
   var obj = {}
   obj.from = user.login;
   obj.time = time;
   obj.color = user.color;
   obj.id = getter.GUID();
   obj.login = user.login;
   return obj;
}


function sendSpecImg(user, time) {
   var command = user.message.split("--")[1];
   if (fs.existsSync("images/specImgs/" + command + ".jpg")) {
      clients.forEach(function(res) {
         var obj = {}
         obj.login = user.login;
         obj.color = user.color;
         obj.img = "/specImgs/" + command + ".jpg"
         obj.time = time;
         obj.type = "specImg";
         res.send(JSON.stringify(obj));
      });
      clients = [];
      fs.appendFile("data/chathistory.txt", user.login + ": " + user.message + "\n", function(err) {
         if (err) throw err;
      });
   }
}
console.timeEnd("Module => chat");
