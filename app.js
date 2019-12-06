console.time("Loading");
console.log("Loading...");
const fs = require('fs');
const cookieParser = require('cookie-parser');
const chat = require('./chat');
const wwt = require('./work-with-token');
const hbs = require("hbs");
const md5 = require("md5");
const express = require('express');
const app = express();
const http = require('http').Server(app);
const usMod = require('./user-module');
const io = require('socket.io')(http);
const pars = require('body-parser');
const crypt = require('./crypt');
const getter = require('./getter');
const uep = pars.urlencoded({
  extended: false
});

const port = 80;
const ip = "192.168.43.47";


hbs.registerPartials(__dirname + "/views/partials");
app.use(express.static(__dirname + "/pages"));
app.use(express.static(__dirname + "/images"));
app.use(express.static(__dirname + "/js"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/userimages"));
app.use(express.static(__dirname + "/sounds"));
app.use(cookieParser());
app.set("view engine", "hbs");

var getUserData = false;
var usersOnline = [];

//Страница входа
app.get("/login", (req, res) => {
  var token = getCookie(req, "token");
  var login = wwt.getLoginFromToken(token);
  if (token && login) {
    wwt.userLogout(token, login);
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      chat.addnewmessage("exit", JSON.parse(data));
      res.clearCookie("token", {
        path: "/"
      })
      res.render("enter.hbs", {});
    })
  } else {
    res.clearCookie("token", {
      path: "/"
    })
    res.render("enter.hbs", {});
  }
})

//Вход
app.post("/enter", uep, (req, res) => {
  var Rlogin = req.body.login;
  var Rpassword = req.body.password;
  if (Rlogin && Rpassword) {
    if (fs.existsSync(`userdata/${Rlogin}.json`)) {
      fs.readFile(`userdata/${Rlogin}.json`, "utf-8", (err, data) => {
        var user = JSON.parse(data);
        if ((Rlogin === user.login) && (md5(Rpassword) === user.password)) {
          var token = genToken();
          fs.readFile("data/tokens.json", "utf-8", (err, data2) => {
            if (data2 == false) data2 = "[]";
            var tokens = JSON.parse(data2);
            var obj = {};
            obj[user.login] = token;
            tokens.push(obj);
            fs.writeFile("data/tokens.json", JSON.stringify(tokens, "", 2), (err) => {
              chat.addnewmessage("enter", user);
              res.cookie("token", token, {
                httpOnly: true
              });
              res.end("token");
            })
          })
        } else {
          res.end("false:Неверный логин или пароль");
        }
      })
    } else {
      res.end("false:Неверный логин или пароль");
    }
  } else {
    res.end("false:Заполните все поля");
  }
})





//Страница чата
app.get("/", (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      res.render("chat.hbs", {
        scroll: JSON.parse(data).scroll,
        login: login
      });
    });
  }
})



//Подписка на сообщения
app.get("/subscribe", (req, res) => {
  var login = wwt.getLoginFromToken(getCookie(req, "token"));
  if (login) {
    chat.subscribe(req, res);
  } else {
    res.redirect("/login");
  }
});

//Новое сообщение
app.post("/addnewmessage", uep, (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      var user = JSON.parse(data);
      user.message = req.body.message;
      chat.addnewmessage("message", user);
      res.end();
    })
  }
});


app.post("/get/message", uep, (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
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
        res.send(JSON.stringify(obj, "", 5));
      } else {
        for (var i = 1; i<obj.maxId; i++){
          msgs[i - 1].color = getter.colorOfUser(msgs[i - 1].from);
          obj.msg.unshift(msgs[i - 1]);
        }
        res.send(JSON.stringify(obj, "", 5));
      }
    });
  }
});

//Настройки
app.get("/settings", (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      if (err) throw err;
      var user = JSON.parse(data);
      res.render("settings.hbs", {
        scroll: user.scroll,
        color: user.color,
        login: login
      });
    })
  }
})




//Друзья
app.get("/friends", (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    res.render("friends.hbs", {
      login: login
    });
  }
})


//Профиль
app.get("/profile", (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      var user = JSON.parse(data);
      getUserData = true;
      var imgStatus = fs.existsSync("userimages/" + user.login + ".jpg");
      var isAdmin = (JSON.parse(fs.readFileSync("data/adminlist.json", "utf-8")).indexOf(login) !== -1);
      res.render("profile.hbs", {
        login: login,
        isAdmin: isAdmin,
        imgStatus: imgStatus,
        color: user.color,
        firstname: user.firstname,
        lastname: user.lastname
      });
    })
  }
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
app.get("/people", uep, (req, res) => {
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

//Процесс регистрации
app.post("/registration", uep, (req, res) => {
  var validate = usMod.registrationValidate(req, res);
  if (validate) {
    var user = {};
    user.login = req.body.login;
    user.password = md5(req.body.password);
    user.age = req.body.age;
    user.sex = req.body.sex;
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    user.color = "F00000";
    user.scroll = true;
    user.friends = [];
    user.inreqs = [];
    user.outreqs = [];
    fs.writeFile(`userdata/${user.login}.json`, JSON.stringify(user, "", 5), (err) => {
      if (err) throw err;
      fs.readFile("data/userlist.json", "utf-8", (err, data) => {
        if (!data) data = "[]";
        var arr = JSON.parse(data);
        arr.push(user.login);
        fs.writeFile("data/userlist.json", JSON.stringify(arr, "", 5), (err) => {
          if (err) throw err;
          res.send("true:true");
        });
      });
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
  res.end(String(getter.GUID()));
});




/*
Команды админа
*/
//Получить логин из токена
app.post("/admin/get/login", uep, (req, res) => {
  var adminLogin = wwt.validateAdmin(req, res);
  if (adminLogin) {
    res.end(wwt.getLoginFromToken(req.body.token));
  }
})

//Получить токен из логина
app.post("/admin/get/token", uep, (req, res) => {
  var adminLogin = wwt.validateAdmin(req, res);
  if (adminLogin) {
    res.end(wwt.getTokenFromLogin(req.body.login));
  }
})

//Установить новую пару (соответствие) токен=логин в tokens.json
app.post("/admin/set/couple", uep, (req, res) => {
  var adminLogin = wwt.validateAdmin(req, res);
  if (adminLogin) {
    wwt.setCouple(req.body.login, req.body.token);
    res.end("true");
  }
})

//Удалить пару (соответствие) в tokens.json
app.post("/admin/delete/couple", uep, (req, res) => {
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

app.post("/admin/make/admin", uep, (req, res) => {
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
  console.log("Clear");
  usersOnline = [];
  io.emit("CheckConnection", "SERVER!");
  setTimeout(() => {
    console.log(usersOnline);
    wwt.clear(usersOnline);
    usersOnline = [];
  }, 2000);
}, 300000)

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

app.post("/admin/make/user", uep, (req, res) => {
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
app.post("/admin/message", uep, (req, res) => {
  var adminLogin = wwt.validateAdmin(req, res);
  if (adminLogin) {
    io.emit("MESSAGE", adminLogin + ": " + req.body.message);
  }
})

//Административная панель
app.get("/adminpanel", (req, res) => {
  var adminLogin = wwt.validateAdmin(req, res);
  if (adminLogin) {
    res.render("adminpanel.hbs", {
      login: adminLogin
    });
  }
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
  var login = wwt.validate(req, res);
  if (login) {
    res.render("incoming.hbs", {
      login: login
    });
  }
});


app.get("/outcoming", (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    res.render("outcoming.hbs", {
      login: login
    });
  }
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
  var login = wwt.validate(req, res);
  if (login) {
    if (fs.existsSync(`userdata/${login}.json`)) {
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
        var user = JSON.parse(data);
        res.end(String(user.inreqs.length));
      });
    } else {
      res.redirect("/login");
    }
  }
})


app.get("/get/outreqs/count", (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    if (fs.existsSync(`userdata/${login}.json`)) {
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
        var user = JSON.parse(data);
        res.end(String(user.outreqs.length));
      });
    } else {
      res.redirect("/login");
    }
  }
})




//Подать заявку на добавление в друзья
app.post("/user/add/friend", uep, (req, res) => {
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
app.post("/user/cancel/outcomingrequest", uep, (req, res) => {
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
app.post("/user/accept/incomingrequest", uep, (req, res) => {
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
app.post("/user/delete/friend", uep, (req, res) => {
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



//Получить данные о пользователе для странице профиля
app.get("/get/:login", (req, res) => {
  var loginFromReq = req.params["login"];
  var token = getCookie(req, "token");
  var login = wwt.getLoginFromToken(token);
  if (login && token && (loginFromReq == login) && getUserData) {
    getUserData = false;
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      var user = JSON.parse(data);
      delete user.password;
      res.end(JSON.stringify(user, "", 5));
    })
  } else {
    res.clearCookie("token");
    res.redirect("/login");
  }
});


app.post("/user/change/password", uep, (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      var user = JSON.parse(data);
      if (usMod.passwordValidate(res, user.password, req.body.oldPassword, req.body.newPassword, req.body.repeatNewPassword) === true) {
        user.password = md5(req.body.newPassword);
        fs.writeFile(`userdata/${login}.json`, JSON.stringify(user, "", 5), (err) => {
          if (err) {
            console.log(err);
            return res.sendStatus(500);
          }
          res.send("true:Пароль успешно изменён!");
        });
      }
    });
  }
});




app.post("/user/change/name", uep, (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    if (usMod.nameValidate(res, req.body.firstname, req.body.lastname) === true) {
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        }
        var user = JSON.parse(data);
        user.firstname = req.body.firstname;
        user.lastname = req.body.lastname;
        fs.writeFile(`userdata/${login}.json`, JSON.stringify(user, "", 5), (err) => {
          if (err) throw err;
          res.send("true:Данные успешно сохранены!\n\n");
        })
      })
    } else {
      res.end();
    }
  }
});

//Сохранить изменения в настройках
app.post("/change-settings", uep, (req, res) => {
  var login = wwt.validate(req, res);
  if (login) {
    fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
      var user = JSON.parse(data);
      if (req.body.scroll === "true") user.scroll = true;
      if (req.body.scroll === "false") user.scroll = false;
      user.color = req.body.color;
      fs.writeFile("userdata/" + user.login + ".json", JSON.stringify(user, "", 5), (err) => {
        if (err) throw err;
        res.end();
      });
    })
  }
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


app.post("/", uep, (req, res) => {
  res.send(JSON.stringify(req.body, "", 5));
})

app.get("/admin/test/1", (req, res) => {
  console.time("TEST");
  fs.readFile("data/chat.json", "utf-8", (err, data) => {
    var arr = JSON.parse(data);
    var obj = {};
    obj.id = "x";
    obj.from = "admin";
    obj.time = "asd";
    obj.txt = "LOLO";
    arr.push(obj);
    fs.writeFile("data/chat.json", JSON.stringify(arr, "", 1), (err) => {
      console.timeEnd("TEST");
      res.end();
    });
  });
});

app.get("/admin/test/2", (req, res) => {
  res.redirect("/");
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
    console.log(e)
    return false;
  }
}

function rn(str) {
  return str.replace("\r", "").replace("\n", "");
};





//Слушать порт
http.listen(port, ip, (err) => {
  console.timeEnd("Loading");
  console.log("Started ::: " + ip + ":" + port);
});
