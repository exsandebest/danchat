console.time("Loading");
console.log("Loading...");
const fs = require('fs');
const cookieParser = require('cookie-parser');
const chat = require('./chat');
const wwt = require('./work-with-token');
const sql = require("./database");
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
app.use(express.static(__dirname + "/sounds"));
app.use(cookieParser());
app.set("view engine", "ejs");



app.get("/login", (req, res) => {
   res.clearCookie("token", {
      path: "/"
   });
   res.render("enter.ejs", {});
})


app.get("/registration", (req, res) => {
   res.render("registration.ejs", {});
});



app.post("/registration", parserJSON, (req, res) => {
   for (key in req.body) {
      req.body[key] = decodeURIComponent(req.body[key]);
   }
   sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, result) => {
      if (result === undefined || result.length === 0) {
         if (usMod.registrationValidate(req, res)) {
            sql.query(`insert into users (login,password,age,sex,firstname,lastname) values (${sql.escape(req.body.login)}, ${sql.escape(md5(req.body.password))},
              ${sql.escape(parseInt(req.body.age))}, ${sql.escape(parseInt(req.body.sex))}, ${sql.escape(req.body.firstname)}, ${sql.escape(req.body.lastname)})`, (err) => {
               if (err) console.error(err);
               res.send("true:true");
            })
         } else {
            res.end('END');
         }
      } else {
         res.send(`false:Данный логин уже занят\n\n`);
      }
   })
});


app.post("/enter", parserJSON, (req, res) => {
   var Rlogin = decodeURIComponent(req.body.login);
   var Rpassword = decodeURIComponent(req.body.password);
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



app.get("/subscribe", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         chat.subscribe(req, res);
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});



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
               msg.text = decodeURIComponent(req.body.message);
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



app.get("/friends", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         var obj = {
            login: u.login
         };
         sql.query(`select from_id from friends_requests where to_id = ${u.id}`, (err, data) => {
            if (err) console.error(err);
            obj.inreqsCounter = ((data === undefined || data.length === 0) ? "" : ` ${data.length} `);
            sql.query(`select to_id from friends_requests where from_id = ${u.id}`, (err, result) => {
               if (err) console.error(err);
               obj.outreqsCounter = ((result === undefined || result.length === 0) ? "" : ` ${result.length} `);
               sql.query(`select id_1 as ids from friends where id_2 = ${u.id} union select id_2 as ids from friends where id_1 = ${u.id}`, (err, dt) => {
                  if (err) console.error(err);
                  if (dt === undefined || dt.length === 0) {
                     obj.friends = [];
                     res.render("friends.ejs", obj);
                     return;
                  }
                  var arr = [];
                  dt.forEach((elem) => {
                     arr.push(elem.ids);
                  })
                  sql.query(`select login, color, imgStatus, firstname, lastname from users where id in (${arr.join()})`, (err, dt2) => {
                     if (err) console.error(err);
                     obj.friends = dt2;
                     res.render("friends.ejs", obj);
                  })
               })
            })
         })

      }
   }, (err) => {
      res.end("DB ERROR");
   });
})


app.get("/incoming", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         var obj = {
            login: u.login
         };
         sql.query(`select to_id from friends_requests where from_id = ${u.id}`, (err, result) => {
            if (err) console.error(err);
            obj.outreqsCounter = ((result === undefined || result.length === 0) ? "" : ` ${result.length} `);
            sql.query(`select from_id from friends_requests where to_id = ${u.id}`, (err, dt) => {
               if (err) console.error(err);
               if (dt === undefined || dt.length === 0) {
                  obj.inreqs = [];
                  res.render("incoming.ejs", obj);
                  return;
               }
               var arr = [];
               dt.forEach((elem) => {
                  arr.push(elem.from_id);
               })
               sql.query(`select login, color, imgStatus, firstname, lastname from users where id in (${arr.join()})`, (err, dt2) => {
                  if (err) console.error(err);
                  obj.inreqs = dt2;
                  res.render("incoming.ejs", obj);
               })
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});



app.get("/outcoming", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         var obj = {
            login: u.login
         };
         sql.query(`select from_id from friends_requests where to_id = ${u.id}`, (err, result) => {
            if (err) console.error(err);
            obj.inreqsCounter = ((result === undefined || result.length === 0) ? "" : ` ${result.length} `);
            sql.query(`select to_id from friends_requests where from_id = ${u.id}`, (err, dt) => {
               if (err) console.error(err);
               if (dt === undefined || dt.length === 0) {
                  obj.outreqs = [];
                  res.render("outcoming.ejs", obj);
                  return;
               }
               var arr = [];
               dt.forEach((elem) => {
                  arr.push(elem.to_id);
               })
               sql.query(`select login, color, imgStatus, firstname, lastname from users where id in (${arr.join()})`, (err, dt2) => {
                  if (err) console.error(err);
                  obj.outreqs = dt2;
                  res.render("outcoming.ejs", obj);
               })
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
});



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



setInterval(() => {
   sql.query(`delete from tokens where time < DATE_SUB(NOW(), INTERVAL 1 DAY)`, (err) => {
      if (err) console.error(err);
   })
}, 3600000) // 1 hour



app.get("/onlineCounter", (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select login from tokens where time < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`, (err, data) => {
            if (err) console.error(err);
            res.send(JSON.stringify(data));
         })
      }
   })
});



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
               var obj = {
                  imgStatus: data[0].imgStatus,
                  userLogin: data[0].login,
                  firstname: data[0].firstname,
                  lastname: data[0].lastname,
                  color: data[0].color,
                  age: data[0].age,
                  login: u.login,
                  sex: (data[0].sex ? "Мужской" : "Женский")
               }
               sql.query(`select id_1 as ids from friends where id_2 = ${data[0].id} union select id_2 as ids from friends where id_1 = ${data[0].id}`, (err, dt) => {
                  if (err) console.error(err);
                  if (dt === undefined || dt.length === 0) {
                     obj.friends = [];
                     if (u.login !== data[0].login) {
                        sql.query(`select * from friends where (id_1 = ${u.id} and id_2 = ${data[0].id}) or (id_2 = ${u.id} and id_1 = ${data[0].id})`, (err, r1) => {
                           if (err) console.error(err);
                           if (r1 === undefined || r1.length === 0) {
                              sql.query(`select * from friends_requests where from_id = ${u.id} and to_id = ${data[0].id}`, (err, r2) => {
                                 if (err) console.error(err);
                                 if (r2 === undefined || r2.length === 0) {
                                    sql.query(`select * from friends_requests where to_id = ${u.id} and from_id = ${data[0].id}`, (err, r3) => {
                                       if (err) console.error(err);
                                       if (r3 !== undefined && r3.length !== 0) {
                                          obj.userStatus = "subscriber";
                                       } else {
                                          obj.userStatus = "default";
                                       }
                                       res.render("user.ejs", obj);
                                    })
                                 } else {
                                    obj.userStatus = "request sent";
                                    res.render("user.ejs", obj);
                                 }
                              })
                           } else {
                              obj.userStatus = "friend";
                              res.render("user.ejs", obj);
                           }
                        })
                     } else {
                        obj.userStatus = "self";
                        res.render("user.ejs", obj);
                     }
                  } else {
                     var arr = [];
                     dt.forEach((elem) => {
                        arr.push(elem.ids);
                     })
                     sql.query(`select login, color, imgStatus, firstname, lastname from users where id in (${arr.join()})`, (err, dt2) => {
                        if (err) console.error(err);
                        obj.friends = dt2;
                        if (u.login !== data[0].login) {
                           sql.query(`select * from friends where (id_1 = ${u.id} and id_2 = ${data[0].id}) or (id_2 = ${u.id} and id_1 = ${data[0].id})`, (err, r1) => {
                              if (err) console.error(err);
                              if (r1 === undefined || r1.length === 0) {
                                 sql.query(`select * from friends_requests where from_id = ${u.id} and to_id = ${data[0].id}`, (err, r2) => {
                                    if (err) console.error(err);
                                    if (r2 === undefined || r2.length === 0) {
                                       sql.query(`select * from friends_requests where to_id = ${u.id} and from_id = ${data[0].id}`, (err, r3) => {
                                          if (err) console.error(err);
                                          if (r3 !== undefined && r3.length !== 0) {
                                             obj.userStatus = "subscriber";
                                          } else {
                                             obj.userStatus = "default";
                                          }
                                          res.render("user.ejs", obj);
                                       })
                                    } else {
                                       obj.userStatus = "request sent";
                                       res.render("user.ejs", obj);
                                    }
                                 })
                              } else {
                                 obj.userStatus = "friend";
                                 res.render("user.ejs", obj);
                              }
                           })
                        } else {
                           obj.userStatus = "self";
                           res.render("user.ejs", obj);
                        }
                     })
                  }
               })
            }
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



app.post("/admin/make/admin", parserURLEncoded, (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         sql.query(`update users set admin = 1 where login = ${sql.escape(decodeURIComponent(req.body.login))}`, (err) => {
            if (err) console.error(err);
            res.send("true");
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



app.post("/admin/make/user", parserJSON, (req, res) => {
   wwt.validateAdmin(req, res).then((u) => {
      if (u) {
         if (decodeURIComponent(req.body.login) === "admin") {
            res.end();
            return;
         }
         sql.query(`update users set admin = 0 where login = ${sql.escape(decodeURIComponent(req.body.login))}`, (err) => {
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
         io.emit("MESSAGE", decodeURIComponent(req.body.message));
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



app.get("/tt", (req, res) => {
   res.render("test.ejs", {});
});



app.post("/user/add/friend", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, dt1) => {
            if (err) console.error(err);
            if (dt1 === undefined || dt1.length === 0) {
               res.send("Incorrect login");
               return;
            }
            var userId = dt1[0].id;
            sql.query(`insert into friends_requests(from_id, to_id) values (${u.id}, ${userId})`, (err) => {
               if (err) console.error(err);
               res.send("true");
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



app.post("/user/cancel/outcomingrequest", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, dt1) => {
            if (err) console.error(err);
            if (dt1 === undefined || dt1.length === 0) {
               res.send("Incorrect login");
               return;
            }
            var userId = dt1[0].id;
            sql.query(`select * from friends_requests where from_id = ${u.id} and to_id = ${userId}`, (err, dt2) => {
               if (err) console.error(err);
               if (dt2 === undefined || dt2.length === 0) {
                  res.send("No requests to cancel");
                  return;
               }
               sql.query(`delete from friends_requests where from_id = ${u.id} and to_id = ${userId}`, (err, dt3) => {
                  if (err) console.error(err);
                  res.send("true");
               })
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



app.post("/user/accept/incomingrequest", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, dt1) => {
            if (err) console.error(err);
            if (dt1 === undefined || dt1.length === 0) {
               res.send("Incorrect login");
               return;
            }
            var userId = dt1[0].id;
            sql.query(`select * from friends_requests where from_id = ${userId} and to_id = ${u.id}`, (err, dt2) => {
               if (err) console.error(err);
               if (dt2 === undefined || dt2.length === 0) {
                  res.send("No requests to accept");
                  return;
               }
               sql.query(`delete from friends_requests where from_id = ${userId} and to_id = ${u.id}`, (err, dt3) => {
                  if (err) console.error(err);
                  sql.query(`insert into friends (id_1, id_2) values (${userId}, ${u.id})`, (err) => {
                     if (err) console.error(err);
                     res.send("true");
                  })
               })
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



app.post("/user/delete/friend", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
         sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, dt1) => {
            if (err) console.error(err);
            if (dt1 === undefined || dt1.length === 0) {
               res.send("Incorrect login");
               return;
            }
            var friendId = dt1[0].id;
            sql.query(`delete from friends where (id_1 = ${u.id} and id_2 = ${friendId}) or (id_2 = ${u.id} and id_1 = ${friendId})`, (err) => {
               if (err) console.error(err);
               sql.query(`insert into friends_requests (from_id, to_id) values (${friendId}, ${u.id})`, (err) => {
                  if (err) console.error(err);
                  res.send("true");
               })
            })
         })
      }
   }, (err) => {
      res.end("DB ERROR");
   });
})



app.post("/user/change/password", parserJSON, (req, res) => {
   for (key in req.body) {
      req.body[key] = decodeURIComponent(req.body[key]);
   }
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
   for (key in req.body) {
      req.body[key] = decodeURIComponent(req.body[key]);
   }
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



app.post("/user/change/settings", parserJSON, (req, res) => {
   wwt.validate(req, res).then((u) => {
      if (u) {
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
               sql.query(`delete from tokens where id = ${u.id}`, (err) => {
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



http.listen(config.port, config.ip, (err) => {
   console.timeEnd("Loading");
   console.log(`Started on : ${config.ip}:${config.port}`);
});
