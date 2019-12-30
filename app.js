console.time("Loading");
console.log("Loading...");
const fs = require('fs');
const cookieParser = require('cookie-parser');
const chat = require('./chat');
const wwt = require('./work-with-token');
const sql = require("./database");
// const hbs = require("hbs");
const md5 = require("md5");
const express = require('express');
const app = express();
const http = require('http').Server(app);
const usMod = require('./user-module');
const io = require('socket.io')(http);
const pars = require('body-parser');
const parserURLEncoded = pars.urlencoded({
   extended: false
});
const parserJSON = pars.json();
const std = require("./standart");


console.time("Config");
var config = JSON.parse(fs.readFileSync("config/main.json", "utf-8"));
console.timeEnd("Config");






app.use(express.static(__dirname + "/images"));
app.use(express.static(__dirname + "/js"));
app.use(express.static(__dirname + "/styles"));
app.use(express.static(__dirname + "/userimages"));
app.use(express.static(__dirname + "/sounds"));
app.use(cookieParser());
app.set("view engine", "ejs");


//Страница входа
app.get("/login", (req, res) => {
   res.clearCookie("token", {
      path: "/"
   });
   res.render("enter.ejs", {});
})

//Вход
app.post("/enter", parserJSON, (req, res) => {
   var Rlogin = req.body.login;
   var Rpassword = req.body.password;
   if (!Rlogin || !Rpassword) {
      res.end("false:Заполните все поля");
      return;
   }
   sql.query(`select id, login, color from users where login= ${sql.escape(Rlogin)} and password = ${sql.escape(md5(Rpassword))}`, (err, data) => {
      if (err) console.error(err);
      if (data === undefined || data.length === 0) {
         res.end("false:Неверный логин или пароль");
         return;
      }
      var user = data[0];
      var token = std.genToken();
      sql.query(`insert into tokens (id, login, token, time) values (${user.id}, ${sql.escape(user.login)}, ${sql.escape(token)}, NOW());`, (err) => {
         if (err) console.error(err);
         sql.query(`select max(id) from users`, (err, result) => {
            var msg = {};
            msg.user_id = user.id;
            msg.login = user.login;
            msg.color = user.color;
            msg.time = new Date().toTimeString().substring(0, 5);
            msg.id = result[0]["max(id)"] + 1;
            msg.type = "enter";
            msg.text = req.body.message;
            chat.addnewmessage(msg);
            res.end();
         })

         res.cookie("token", token, {
            path: "/",
            httpOnly: true
         });
         res.end("token");
      })
   })
})






//Страница чата
app.get("/", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select scroll from users where id = ${u.id}`, (err, result) => {
            res.render("chat.ejs", {
               scroll: result[0].scroll,
               login: u.login
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



//Подписка на сообщения
app.get("/subscribe", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         chat.subscribe(req, res);
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});

//Новое сообщение
app.post("/addnewmessage", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select color from users where id = ${u.id}`, (err, result) => {
            if (err) console.error(err);
            sql.query(`select max(id) from chat`, (err, data) => {
               var msg = {};
               msg.user_id = u.id;
               msg.login = u.login;
               msg.color = result[0].color;
               msg.time = new Date().toTimeString().substring(0, 5);
               msg.id = data[0]["max(id)"] + 1;
               msg.type = "message";
               msg.text = req.body.message;
               chat.addnewmessage(msg);
               res.end();
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});





app.post("/get/message", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         var portion = 50;
         var msgId = parseInt(req.body.id);
         if (msgId === -1) {
            sql.query(`select login, color, id, DATE_FORMAT(time, '%H:%i') as time, type, text from chat where id >= ((select max(id) from chat)-${portion-1}) order by id desc limit ${portion}`, (err, data) => {
               if (err) console.error(err);
               res.send(JSON.stringify(data));
            })
         } else {
            var msgStart = msgId - portion;
            var msgEnd = msgId - 1;
            sql.query(`select login, color, id, type, text, DATE_FORMAT(time, '%H:%i') as time from chat where id between ${msgStart} and ${msgEnd} order by id desc limit ${portion}`, (err, data) => {
               if (err) console.error(err);
               res.send(JSON.stringify(data));
            })
         }
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


app.get("/settings", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select scroll, color from users where id = ${u.id}`, (err, data) => {
            if (err) console.error(err);
            res.render("settings.ejs", {
               scroll: data[0].scroll,
               color: data[0].color,
               login: u.login
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})




//Друзья
app.get("/friends", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         res.render("friends.ejs", {
            login: u.login
         });
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})




app.get("/profile", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select admin, color, firstname, lastname, imgStatus from users where id = ${u.id}`, (err, data) => {
            res.render("profile.ejs", {
               login: u.login,
               isAdmin: data[0].admin,
               imgStatus: data[0].imgStatus,
               color: data[0].color,
               firstname: data[0].firstname,
               lastname: data[0].lastname
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})

setInterval(()=>{
   sql.query(`delete from tokens where time < DATE_SUB(NOW(), INTERVAL 1 DAY)`, (err)=>{
      if (err) console.error(err);
   })
}, 3600000) // 1 hour




app.get("/onlineCounter", (req, res) => {
   wwt.validate(req, res).then((u)=>{
      if (u) {
         sql.query(`select login from tokens where time < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`, (err, data)=>{
            if (err) console.error(err);
            res.send(JSON.stringify(data));
         })
      }
   })
});

//Страница Люди
app.get("/people", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select login, firstname, lastname, color, imgStatus from users`, (err, data) => {
            if (err) console.error(err);
            var people = [];
            data.forEach((elem) => {
               people.push(elem);
            })
            res.render("people.ejs", {
               login: u.login,
               people: people
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})

//Страница регистрации
app.get("/registration", (req, res) => {
   res.render("registration.ejs", {});
});

//Процесс
app.post("/registration", parserJSON, (req, res) => {
   var validate = usMod.registrationValidate(req, res);
   if (validate) {
      sql.query(`insert into users (login,password,age,sex,firstname,lastname) values (${sql.escape(req.body.login)}, ${sql.escape(md5(req.body.password))},
        ${sql.escape(parseInt(req.body.age))}, ${sql.escape(parseInt(req.body.sex))}, ${sql.escape(req.body.firstname)}, ${sql.escape(req.body.lastname)})`, (err) => {
         if (err) console.error(err);
         res.send("true:true");
      })
   } else {
      res.end();
   }
});


//Профиль пользователя
app.get("/u/:userLogin", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         var userLogin = req.params.userLogin;
         sql.query(`select id, login, firstname, lastname, color, age, sex, imgStatus from users where login = ${sql.escape(userLogin)}`, (err, data) => {
            if (err) console.error(err);
            if (data === undefined || data.length === 0) {
               res.render("404.ejs", {
                  message: "This user does not exist",
                  login: u.login
               })
               return;
            } else {
               var uStatus = "self";
               if (u.login !== data[0].login) {
                  sql.query(`select * from friends where (id_1 = ${u.id} and id_2 = ${data[0].id}) or (id_2 = ${u.id} and id_1 = ${data[0].id})`, (err, r1) => {
                     if (err) console.error(err);
                     if (!r1) {
                        sql.query(`select * from friends_requests where from_id = ${u.id} and to_id = ${data[0].id}`, (err, r2) => {
                           if (err) console.error(err);
                           if (!r2) {
                              sql.query(`select * from friends_requests where to_id = ${data[0].id} and from_id = ${u.id}`, (err, r3) => {
                                 if (err) console.error(err);
                                 if (r3) {
                                    uStatus = "subscriber";
                                 } else {
                                    uStatus = "default";
                                 }
                              })
                           }
                           uStatus = "request sent";
                           return;
                        })
                     } else {
                        uStatus = "friend";
                        return;
                     }
                  })
               }
               // FIXME: TO EJS
               res.render("user.ejs", {
                  userStatus: uStatus,
                  imgStatus: data[0].imgStatus,
                  userLogin: data[0].login,
                  firstname: data[0].firstname,
                  lastname: data[0].lastname,
                  color: data[0].color,
                  age: data[0].age,
                  login: u.login,
                  sex: (data[0].sex ? "Мужской" : "Женский")
               });
            }
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


app.get("/get/GUID", (req, res) => {
   sql.query(`select max(id) from chat`, (err, data) => {
      res.end(String(data[0]["max(id)"]))
   })
});




/*
Команды админа
*/

app.post("/admin/make/admin", parserURLEncoded, (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         sql.query(`update users set admin = 1 where login = ${sql.escape(req.body.login)}`, (err) => {
            if (err) console.error(err);
            res.sned("true");
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})

app.post("/admin/make/user", parserJSON, (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         if (req.body.login === "admin") {
            res.end();
            return;
         }
         sql.query(`update users set admin = 0 where login = ${sql.escape(req.body.login)}`, (err) => {
            if (err) console.error(err);
            res.send("true");
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})

app.post("/admin/message", parserJSON, (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         io.emit("MESSAGE", req.body.message);
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})

app.get("/adminpanel", (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         res.render("adminpanel.ejs", {
            login: u.login
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})







app.get("/app/get/function/:function", (req, res) => {
   var funcName = req.params["function"];
   res.setHeader("Content-Type", "	application/ecmascript");
   if (fs.existsSync("js/functions/" + funcName + ".js")) {
      fs.readFile("js/functions/" + funcName + ".js", "utf-8", (err, data) => {
         if (err) throw err;
         res.end(data);
      })
   } else {
      res.end();
   }
})


app.get("/tt", (req, res) => {
   res.render("test.ejs", {});
});

app.get("/incoming", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         res.render("incoming.ejs", {
            login: u.login
         });
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});


app.get("/outcoming", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         res.render("outcoming.ejs", {
            login: u.login
         });
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});


app.get("/user/get/outreqs/data", (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      var friendsData = [];
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         var user = JSON.parse(data);
         for (var i = 0; i < user.outreqs.length; i++) {
            var friendLogin = user.outreqs[i];
            if (fs.existsSync("userdata/" + friendLogin + ".json")) {
               var result = fs.readFileSync("userdata/" + friendLogin + ".json", "utf-8");
               var friend = JSON.parse(result);
               var friendData = {}
               friendData.login = friend.login;
               friendData.firstname = friend.firstname;
               friendData.lastname = friend.lastname;
               friendData.color = friend.color;
               if (fs.existsSync("userimages/" + friend.login + ".jpg")) {
                  friendData.imgStatus = true;
               } else {
                  friendData.imgStatus = false;
               }
               friendsData.push(friendData);
            }
         }
         res.end(JSON.stringify(friendsData, "", 5));
      })
   }
});



app.get("/user/get/inreqs/data", (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      var friendsData = [];
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         var user = JSON.parse(data);
         for (var i = 0; i < user.inreqs.length; i++) {
            var friendLogin = user.inreqs[i];
            if (fs.existsSync("userdata/" + friendLogin + ".json")) {
               var result = fs.readFileSync("userdata/" + friendLogin + ".json", "utf-8");
               var friend = JSON.parse(result);
               var friendData = {}
               friendData.login = friend.login;
               friendData.firstname = friend.firstname;
               friendData.lastname = friend.lastname;
               friendData.color = friend.color;
               if (fs.existsSync("userimages/" + friend.login + ".jpg")) {
                  friendData.imgStatus = true;
               } else {
                  friendData.imgStatus = false;
               }
               friendsData.push(friendData);
            }
         }
         res.end(JSON.stringify(friendsData, "", 5));
      })
   }
});


app.get("/get/inreqs/count", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select * from friends_requests where to_id = ${u.id}`, (err, data) => {
            if (err) console.error(err);
            res.end(String((data === undefined ? 0 : data.length)));
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


app.get("/get/outreqs/count", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select * from friends_requests where from_id = ${u.id}`, (err, data) => {
            if (err) console.error(err);
            res.end(String((data === undefined ? 0 : data.length)));
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})




//Подать заявку на добавление в друзья
app.post("/user/add/friend", parserURLEncoded, (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         if (err) throw err;
         var user = JSON.parse(data);
         user.outreqs.push(req.body.friend);
         fs.writeFile(`userdata/${login}.json`, JSON.stringify(user, '', 5), (err) => {
            if (err) throw err;
            if (fs.existsSync("userdata/" + req.body.friend + ".json")) {
               fs.readFile("userdata/" + req.body.friend + ".json", "utf-8", (err, result) => {
                  if (err) throw err;
                  var friend = JSON.parse(result);
                  friend.inreqs.push(login);
                  fs.writeFile("userdata/" + req.body.friend + ".json", JSON.stringify(friend, "", 5), (err) => {
                     if (err) throw err;
                     res.end("true")
                  })
               });
            }
         })
      })
   }
})


//Отвенить заявку
app.post("/user/cancel/outcomingrequest", parserURLEncoded, (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      if (fs.existsSync("userdata/" + req.body.user + ".json")) {
         fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
            if (err) throw err;
            var user = JSON.parse(data);
            user.outreqs.splice(user.outreqs.indexOf(req.body.user), 1);
            fs.writeFile(`userdata/${login}.json`, JSON.stringify(user, "", 5), (err) => {
               if (err) throw err;
               fs.readFile("userdata/" + req.body.user + ".json", "utf-8", (err, result) => {
                  user = JSON.parse(result);
                  user.inreqs.splice(user.inreqs.indexOf(login), 1);
                  fs.writeFile("userdata/" + req.body.user + ".json", JSON.stringify(user, "", 5), (err) => {
                     if (err) throw err;
                     res.end("true");
                  })
               })
            })
         })
      }
   }
})


//Принять заявку на добавление в друзья
app.post("/user/accept/incomingrequest", parserURLEncoded, (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      if (fs.existsSync("userdata/" + req.body.user + ".json")) {
         fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
            var user = JSON.parse(data);
            var tempUser = user.inreqs[user.inreqs.indexOf(req.body.user)];
            user.inreqs.splice(user.inreqs.indexOf(req.body.user), 1);
            user.friends.push(tempUser);
            fs.writeFile(`userdata/${login}.json`, JSON.stringify(user, "", 5), (err) => {
               if (err) throw err;
               fs.readFile("userdata/" + req.body.user + ".json", "utf-8", (err, result) => {
                  user = JSON.parse(result);
                  tempUser = user.outreqs[user.outreqs.indexOf(login)];
                  user.outreqs.splice(user.outreqs.indexOf(login), 1);
                  user.friends.push(tempUser);
                  fs.writeFile("userdata/" + req.body.user + ".json", JSON.stringify(user, "", 5), (err) => {
                     if (err) throw err;
                     res.end("true");
                  })
               })
            })
         })
      }
   }
})

//Получить данные о друзьях пользователя
app.get("/user/get/friends/data", (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      var friendsData = [];
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         var user = JSON.parse(data);
         for (var i = 0; i < user.friends.length; i++) {
            var friendLogin = user.friends[i];
            if (fs.existsSync("userdata/" + friendLogin + ".json")) {
               var result = fs.readFileSync("userdata/" + friendLogin + ".json", "utf-8");
               var friend = JSON.parse(result);
               var friendData = {}
               friendData.login = friend.login;
               friendData.firstname = friend.firstname;
               friendData.lastname = friend.lastname;
               friendData.color = friend.color;
               if (fs.existsSync("userimages/" + friend.login + ".jpg")) {
                  friendData.imgStatus = true;
               } else {
                  friendData.imgStatus = false;
               }
               friendsData.push(friendData);
            }
         }
         res.end(JSON.stringify(friendsData, "", 5));
      })
   }
});

//Удалить из друзей
app.post("/user/delete/friend", parserURLEncoded, (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      if (fs.existsSync("userdata/" + req.body.friend + ".json")) {
         fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
            var user = JSON.parse(data);
            var tempUser = user.friends[user.friends.indexOf(req.body.friend)];
            user.friends.splice(user.friends.indexOf(req.body.friend), 1);
            user.inreqs.push(tempUser);
            fs.writeFile(`userdata/${login}.json`, JSON.stringify(user, "", 5), (err) => {
               if (err) throw err;
               fs.readFile("userdata/" + req.body.friend + ".json", "utf-8", (err, result) => {
                  user = JSON.parse(result);
                  tempUser = user.friends[user.friends.indexOf(login)];
                  user.friends.splice(user.friends.indexOf(login), 1);
                  user.outreqs.push(tempUser);
                  fs.writeFile("userdata/" + req.body.friend + ".json", JSON.stringify(user, "", 5), (err) => {
                     if (err) throw err;
                     res.end("true");
                  });
               })
            });
         })
      }
   }
})


app.post("/user/change/password", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select password from users where id = ${u.id}`, (err, data) => {
            if (err) console.error(err);
            if (usMod.passwordValidate(res, data[0].password, req.body.oldPassword, req.body.newPassword, req.body.repeatNewPassword) === true) {
               sql.query(`update users set password = ${sql.escape(md5(req.body.newPassword))} where id = ${u.id}`, (err) => {
                  if (err) console.error(err);
                  res.send("true:Пароль успешно изменён!");
               })
            }
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});




app.post("/user/change/name", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         if (usMod.nameValidate(res, req.body.firstname, req.body.lastname) === true) {
            sql.query(`update users set firstname = ${sql.escape(req.body.firstname)}, lastname = ${sql.escape(req.body.lastname)} where id = ${u.id}`, (err) => {
               if (err) console.error(err);
               res.send("true:Данные успешно сохранены\n\n");
            })
         }
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});

//Сохранить изменения в настройках
app.post("/user/change/settings", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         console.log(req.body);
         console.log(typeof req.body.scroll);
         var scroll = true;
         if (req.body.scroll === true) {
            scroll = true;
         } else if (req.body.scroll === false) {
            scroll = false;
         } else {
            res.end("Incorrect values");
            return;
         }
         sql.query(`update users set scroll = ${(scroll?1:0)}, color = ${sql.escape(req.body.color)} where id = ${u.id}`, (err, data) => {
            if (err) console.error(err);
            res.end("OK");
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})





//Выход
app.get("/logout", (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         sql.query(`select color from users where id = ${u.id}`, (err, result) => {
            if (err) console.error(err);
            sql.query(`select max(id) from users`, (err, data) => {
               var msg = {};
               msg.user_id = u.id;
               msg.login = u.login;
               msg.color = result[0].color;
               msg.time = new Date().toTimeString().substring(0, 5);
               msg.id = data[0]["max(id)"] + 1;
               msg.type = "exit";
               sql.query(`delete from tokens where id = ${u.id}`,(err)=>{
                  if (err) console.error(err);
                  chat.addnewmessage(msg);
                  res.clearCookie("token");
                  res.redirect("/login");
                  res.end();
               })
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


app.post("/urlencoded", parserURLEncoded, (req, res) => {
   res.send(JSON.stringify(req.body, "", 5));
})

app.post("/json", parserJSON, (req, res) => {
   res.send(JSON.stringify(req.body, "", 5));
})




app.get("/console/sql", (req, res) => {
   fs.readFile("secret/consoleSql.html", "utf-8", (err, data) => {
      if (err) console.error(err);
      res.send(data);
   })
})

app.post("/console/sql/query", parserJSON, (req, res) => {
   console.log(req.body.q);
   sql.query(req.body.q, (err, result, fields) => {
      if (err) console.error(err);
      console.log(result);
      res.send(JSON.stringify(result, "", 5));
   })
})


//Слушать порт
http.listen(config.port, config.ip, (err) => {
   console.timeEnd("Loading");
   console.log(`Started on : ${config.ip}:${config.port}`);
});
