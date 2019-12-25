console.time("Loading");
console.log("Loading...");
const fs = require('fs');
const cookieParser = require('cookie-parser');
const chat = require('./chat');
const wwt = require('./work-with-token');
const sql = require("./database");
const hbs = require("hbs");
const md5 = require("md5");
const express = require('express');
const app = express();
const http = require('http').Server(app);
const usMod = require('./user-module');
const io = require('socket.io')(http);
const pars = require('body-parser');
const getter = require('./getter');
const parserURLEncoded = pars.urlencoded({
   extended: false
});
const parserJSON = pars.json();


console.time("Config");
var config = JSON.parse(fs.readFileSync("config/main.json", "utf-8"));
console.timeEnd("Config");






hbs.registerPartials(__dirname + "/views/partials");
app.use(express.static(__dirname + "/pages"));
app.use(express.static(__dirname + "/images"));
app.use(express.static(__dirname + "/js"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/userimages"));
app.use(express.static(__dirname + "/sounds"));
app.use(cookieParser());
app.set("view engine", "hbs");

var usersOnline = [];

//Страница входа
app.get("/login", (req, res) => {
   res.clearCookie("token", {
      path: "/"
   });
   res.render("enter.hbs", {});
})

//Вход
app.post("/enter", parserURLEncoded, (req, res) => {
   var Rlogin = req.body.login;
   var Rpassword = req.body.password;
   if (!Rlogin || !Rpassword) {
      res.end("false:Заполните все поля");
      return;
   }
   sql.query(`select login, color from users where login= '${Rlogin}' and password = '${md5(Rpassword)}'`, (err, data) => {
      if (err) console.error(err);
      if (data === undefined || data.length === 0) {
         res.end("false:Неверный логин или пароль");
         return;
      }
      var user = data[0];
      var token = genToken();
      sql.query(`insert into tokens (id, token) values (${user.id}, '${token}')`, (err) => {
         if (err) console.error(err);
            sql.query(`select max(id) from users`, (err, result)=>{
               var msg = {};
               msg.user_id = id;
               msg.from = user.login;
               msg.color = user.color;
               msg.time = new Date().toTimeString().substring(0,5);
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
   wwt.validate(req, res).then((resolve) => {
      if (resolve) {
         sql.query(`select scroll, login from users where id = ${sql.escape(resolve)}`, (err, result) => {
            res.render("chat.hbs", {
               scroll: result[0].scroll,
               login: result[0].login
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



//Подписка на сообщения
app.get("/subscribe", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         chat.subscribe(req, res);
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});

//Новое сообщение
app.post("/addnewmessage", parserURLEncoded, (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login, color from users where id = ${id}`, (err, result) => {
            if (err) console.error(err);
            sql.query(`select max(id) from users`, (err, data)=>{
               var msg = {};
               msg.user_id = id;
               msg.from = result[0].login;
               msg.color = result[0].color;
               msg.time = new Date().toTimeString().substring(0,5);
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





app.post("/get/message", parserURLEncoded, (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         fs.readFile("data/chat.json", "utf-8", (err, data) => {
            var msgs = JSON.parse(data);
            var obj = {};
            obj.maxId = Number(req.body.id);
            obj.msg = [];
            if (obj.maxId - 20 >= 1) {
               obj.minId = obj.maxId - 20;
               for (var i = obj.minId; i < obj.maxId; i++) {
                  msgs[i - 1].color = getter.colorOfUser(msgs[i - 1].from);
                  obj.msg.unshift(msgs[i - 1]);
               }
               res.end(JSON.stringify(obj, "", 5));
            } else {
               for (var i = 1; i < obj.maxId; i++) {
                  msgs[i - 1].color = getter.colorOfUser(msgs[i - 1].from);
                  obj.msg.unshift(msgs[i - 1]);
               }
               res.end(JSON.stringify(obj, "", 5));
            }
         });
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});

//Настройки
app.get("/settings", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login, scroll, color from users where id = ${id}`, (err, data) => {
            if (err) console.error(err);
            res.render("settings.hbs", {
               scroll: data[0].scroll,
               color: data[0].color,
               login: data[0].login
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})




//Друзья
app.get("/friends", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login from users where id = ${id}`, (err, data) => {
            if (err) console.error(err);
            res.render("friends.hbs", {
               login: data[0].login
            });
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


//Профиль
app.get("/profile", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login, admin, color, firstname, lastname from users where id = ${id}`, (err, data) => {
            res.render("profile.hbs", {
               login: data[0].login,
               isAdmin: data[0].admin,
               imgStatus: false,
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

// Счетчик людей онлайн
app.get("/onlineCounter", (req, res) => {
   fs.readFile("data/tokens.json", "utf-8", (err, data) => {
      var tokens = JSON.parse(data);
      var people = [];
      tokens.forEach((elem) => {
         for (key in elem) {
            people.push(key);
         }
      })
      res.send(JSON.stringify(people, "", 5));
   })
});

//Страница Люди
app.get("/people", parserURLEncoded, (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login, firstname, lastname, color, imgStatus from users`)
      }
   }, (err) => {
      res.end("DB ERROR");
   });


   var login = wwt.validate(req, res);
   if (login) {
      fs.readFile("data/userlist.json", "utf-8", (err, data) => {
         if (!data) data = "[]";
         var users = JSON.parse(data);
         var people = [];
         users.forEach((username) => {
            if (fs.existsSync(`userdata/${username}.json`)) {
               fs.readFile(`userdata/${username}.json`, "utf-8", (err, data) => {
                  var user = JSON.parse(data);
                  var obj_user = {};
                  obj_user.login = user.login;
                  obj_user.firstname = user.firstname;
                  obj_user.lastname = user.lastname;
                  obj_user.color = user.color;
                  obj_user.imgStatus = fs.existsSync("userimages/" + user.login + ".jpg");
                  people.push(obj_user);
               })
            }
         })
         res.render("people.hbs", {
            login: login,
            people: people
         })
      })

   }
})

//Страница регистрации
app.get("/registration", (req, res) => {
   res.render("registration.hbs", {});
});

//Процесс
app.post("/registration", parserURLEncoded, (req, res) => {
   var validate = usMod.registrationValidate(req, res);
   if (validate) {
      sql.query(`insert into users (login,password,age,sex,firstname,lastname) values (${sql.escape(req.body.login)}, ${sql.escape(md5(req.body.password))},
      ${sql.escape(praseInt(req.body.age))}, ${sql.escape(parseInt(req.body.sex))}, ${sql.escape(req.body.firstname)}, ${sql.escape(req.body.lastname)})`, (err)=>{
         if (err) console.error(err);
         res.send("true:true");
      })
   } else {
      res.end();
   }
});


//Профиль пользователя
app.get("/user", (req, res) => {
   var login = wwt.validate(req, res);
   if (login) {
      try {
         var userlogin = decodeURI(req.url.split("?")[1]);
      } catch (e) {
         res.render("404.hbs", {
            message: "This user does not exist",
            login: login
         });
      }
      if (fs.existsSync(`userdata/${userlogin}.json`) === false) {
         res.render("404.hbs", {
            message: "This user does not exist",
            login: login
         });
      } else {
         var user = JSON.parse(fs.readFileSync(`userdata/${login}.json`, "utf-8"));
         var userstatus = "";
         if (user.inreqs.indexOf(userlogin) != -1) {
            userstatus = "subscriber";
         } else if (user.outreqs.indexOf(userlogin) != -1) {
            userstatus = "request sent";
         } else if (user.friends.indexOf(userlogin) != -1) {
            userstatus = "friend";
         } else if (userlogin == login) {
            userstatus = "self";
         } else {
            userstatus = "default";
         }
         var imgStatus = fs.existsSync("userimages/" + userlogin + ".jpg");
         fs.readFile(`userdata/${userlogin}.json`, (err, data) => {
            if (err) throw err;
            var user = JSON.parse(data);
            var friends = [];
            for (var i = 0; i < 6; i++) {
               if (fs.existsSync("userdata/" + user.friends[i] + ".json")) {
                  fs.readFile("userdata/" + user.friends[i] + ".json", "utf-8", (err, data) => {
                     var user = JSON.parse(data);
                     var obj = {}
                     obj.login = user.login;
                     obj.firstname = user.firstname;
                     obj.lastname = user.lastname;
                     obj.imgStatus = fs.existsSync("userimages/" + user.login + ".jpg");
                     friends.push(obj);
                  });
               }
            }
            if (user.sex === "male") user.sex = "Мужской";
            if (user.sex === "female") user.sex = "Женский";
            res.render("user.hbs", {
               userstatus: userstatus,
               imgStatus: imgStatus,
               userlogin: user.login,
               firstname: user.firstname,
               lastname: user.lastname,
               color: user.color,
               age: user.age,
               login: login,
               sex: user.sex,
               friends: friends
            });
         })
      }
   }
})


app.get("/get/GUID", (req, res) => {
   sql.query(`select max(id) from chat`, (err, data)=>{
      res.end(String(data[0]["max(id)"]))
   })
});




/*
Команды админа
*/
//Получить логин из токена
app.post("/admin/get/login", parserURLEncoded, (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      res.end(wwt.getLoginFromToken(req.body.token));
   }
})

//Получить токен из логина
app.post("/admin/get/token", parserURLEncoded, (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      res.end(wwt.getTokenFromLogin(req.body.login));
   }
})

//Установить новую пару (соответствие) токен=логин в tokens.json
app.post("/admin/set/couple", parserURLEncoded, (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      wwt.setCouple(req.body.login, req.body.token);
      res.end("true");
   }
})

//Удалить пару (соответствие) в tokens.json
app.post("/admin/delete/couple", parserURLEncoded, (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      wwt.userLogout(wwt.getTokenFromLogin(req.body.login), req.body.login);
      res.end("true");
   }
})


//Валидировать пользователя административной панели
app.get("/admin/validate/me", (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      res.end(wwt.validate(req, res))
   }
})

app.get("/users/toMakeAdmin/list", (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      fs.readFile("data/userlist.json", "utf-8", (err, data) => {
         var users = JSON.parse(data);
         fs.readFile("data/adminlist.json", "utf-8", (err, data2) => {
            var admins = JSON.parse(data2);
            admins.forEach((elem) => {
               if (users.indexOf(elem) !== -1) {
                  users.splice(users.indexOf(elem), 1);
               }
            })
            res.send(JSON.stringify(users, "", 5));
         });
      });
   }
});


app.get("/users/toMakeUser/list", (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      fs.readFile("data/adminlist.json", "utf-8", (err, data) => {
         if (!data) data = "[]";
         res.send(data);
      })
   }
});

app.post("/admin/make/admin", parserURLEncoded, (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      if (fs.existsSync("userdata/" + req.body.user + ".json")) {
         fs.readFile("data/adminlist.json", "utf-8", (err, data2) => {
            if (err) throw err;
            if (!data2) data2 = "[]";
            var arr = JSON.parse(data2);
            arr.push(req.body.user);
            fs.writeFile("data/adminlist.json", JSON.stringify(arr, "", 5), (err) => {
               if (err) throw err;
               res.send("True");
            });
         })
      }
   }
})

setInterval(() => {
   //console.log("Clearing");
   usersOnline = [];
   io.emit("CheckConnection", "SERVER!");
   setTimeout(() => {
      //console.log(usersOnline);
      wwt.clear(usersOnline);
   }, 10000);
}, 300000);

app.get("/admin/online/update", (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      usersOnline = [];
      io.emit("CheckConnection", "SERVER!");
      setTimeout(() => {
         console.log(usersOnline);
         wwt.clear(usersOnline);
         usersOnline = [];
         res.send("OK");
      }, 2000);
   }

})

io.on("connection", (socket) => {
   socket.on("CheckConnectionAnswer", (answer) => {
      usersOnline.push(answer);
   });
});

app.post("/admin/make/user", parserURLEncoded, (req, res) => {
   var adminLogin = wwt.validateAdmin(req, res);
   if (adminLogin) {
      if (fs.existsSync("userdata/" + req.body.login + ".json")) {
         fs.readFile("data/adminlist.json", "utf-8", (err, data2) => {
            if (err) throw err;
            if (!data2) data2 = "[]";
            var arr = JSON.parse(data2);
            arr.splice(arr.indexOf(req.body.login), 1);
            fs.writeFile("data/adminlist.json", JSON.stringify(arr, "", 5), (err) => {
               if (err) throw err;
               res.send("true");
            });
         });
      }
   }
})

app.post("/admin/message", parserURLEncoded, (req, res) => {
   wwt.validateAdmin(req, res).then((id) => {
      if (id) {
         io.emit("MESSAGE", req.body.message);
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})

//Административная панель
app.get("/adminpanel", (req, res) => {
   wwt.validateAdmin(req, res).then((id) => {
      if (id) {
         sql.query(`select login from users where id = ${id}`, (err, data) => {
            res.render("adminpanel.hbs", {
               login: data[0].login
            })
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
   res.render("test.hbs", {});
});

app.get("/ddos", (req, res) => {
   res.render("ddos.hbs", {});
});


app.post("/user/upload/photo/profile", (req, res) => {
   console.log(req.files);
});


app.get("/incoming", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login from users where id = ${id}`, (err, data) => {
            if (err) console.error(err);
            res.render("incoming.hbs", {
               login: data[0].login
            });
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});


app.get("/outcoming", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select login from users where id = ${id}`, (err, data) => {
            if (err) console.error(err);
            res.render("outcoming.hbs", {
               login: data[0].login
            });
         })
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
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select * from friends_requests where to_id = ${id}`, (err, data) => {
            if (err) console.error(err);
            res.end(String((data === undefined ? 0 : data.length)));
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


app.get("/get/outreqs/count", (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select * from friends_requests where from_id = ${id}`, (err, data) => {
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


app.post("/user/change/password", parserURLEncoded, (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         sql.query(`select password from users where id = ${id}`, (err, data) => {
            if (err) console.error(err);
            if (usMod.passwordValidate(res, data[0].password, req.body.oldPassword, req.body.newPassword, req.body.repeatNewPassword) === true) {
               sql.query(`update users set password = ${sql.escape(md5(req.body.newPassword))} where id = ${id}`, (err) => {
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




app.post("/user/change/name", parserURLEncoded, (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         if (usMod.nameValidate(res, req.body.firstname, req.body.lastname) === true) {
            sql.query(`update users set firstname = ${sql.escape(req.body.firstname)}, lastname = ${sql.escape(req.body.lastname)} where id = ${id}`, (err) => {
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
app.post("/user/change/settings", parserURLEncoded, (req, res) => {
   wwt.validate(req, res).then((id) => {
      if (id) {
         var scroll = true;
         if (req.body.scroll === "true") {
            scroll = true;
         } else if (req.body.scroll === "false") {
            scroll = false;
         } else {
            res.end("Incorrect values");
            return;
         }
         sql.query(`update users set scroll = ${(scroll?1:0)}, color = '${req.body.color}' where id = ${id}`, (err, data) => {
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
   var token = getCookie(req, "token");
   var login = wwt.getLoginFromToken(token);
   if (login && token && fs.existsSync(`userdata/${login}.json`)) {
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         wwt.userLogout(token, login);
         chat.addnewmessage("exit", JSON.parse(data));
         res.clearCookie("token");
         res.redirect("/login");
      })
   } else {
      res.clearCookie("token", {
         path: "/"
      });
      res.redirect("/login");
   }
})


app.post("/", parserURLEncoded, (req, res) => {
   res.send(JSON.stringify(req.body, "", 5));
})



//Функция генерации токена
function genToken() {
   var text = "";
   var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890__";
   for (var i = 0; i < 30; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
   return text;
}

function getCookie(req, name) {
   try {
      var matches = req.headers.cookie.match(new RegExp(
         "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
      ));
      return matches ? decodeURIComponent(matches[1]) : false;
   } catch (e) {
      console.error(e)
      return false;
   }
}

function rn(str) {
   return str.replace("\r", "").replace("\n", "");
};

app.get("/console/sql", (req, res) => {
   fs.readFile("secret/consoleSql.html", "utf-8", (err, data) => {
      if (err) console.error(err);
      res.send(data);
   })
})

app.post("/console/sql/query", parserURLEncoded, (req, res) => {
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
