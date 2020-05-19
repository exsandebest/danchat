'use strict';
console.time("Loading");
console.log("Loading...");
if (!process.env.USING_SERVER) {
    require('dotenv').config({
        path: "config/.env"
    });
}
const pre = require("./pre");
const fs = require("fs");
const cookieParser = require('cookie-parser');
const pars = require('body-parser');
const md5 = require("md5");
const avatarGenerator = require('avatar-generator');
const avatar = new avatarGenerator();
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const chat = require('./modules/chat');
const wwt = require('./modules/work-with-token');
const sql = require("./modules/database");
const usMod = require('./modules/user-module');
const std = require("./modules/standard");
const ResponseObject = require("./modules/ResponseObject");
const parserURLEncoded = pars.urlencoded({
    extended: false
});
const parserJSON = pars.json();

app.use(express.static(__dirname + "/public", {
    maxAge: "1h"
}));
app.use(cookieParser());
app.set("view engine", "ejs");



app.get("/login", (req, res) => {
    res.clearCookie("danchat.token");
    res.clearCookie("danchat.user.color");
    res.clearCookie("danchat.user.scroll");
    res.render("login.ejs", {
        notification: ""
    });
})


app.get("/registration", (req, res) => {
    res.render("registration.ejs", {
        notificationType: "Good",
        notificationText1: "",
        notificationText2: ""
    });
});


app.post("/registration", parserURLEncoded, (req, res) => {
    sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, result) => {
        if (result === undefined || result.length === 0) {
            let validation = usMod.registrationValidate(req, res);
            if (validation.status) {
                sql.query(`insert into users (login,password,birthdate,sex,firstname,lastname) values
            (${sql.escape(req.body.login)}, ${sql.escape(md5(req.body.password))},
              ${sql.escape(req.body.birthdate.split(".").reverse().join("-"))}, ${sql.escape(parseInt(req.body.sex))},
              ${sql.escape(req.body.firstname)}, ${sql.escape(req.body.lastname)})`, (err) => {
                    if (err) console.error(err);
                    sql.query(`select login, color, id, scroll, sex from users where login = ${sql.escape(req.body.login)}`, (err, data) => {
                        if (err) console.error(err);
                        sql.query(`select max(id) as maxId from chat`, (err, result) => {
                            let msg = {};
                            msg.type = "registration";
                            io.emit("chatMessage", msg);
                            msg.user_id = data[0].id;
                            msg.login = data[0].login;
                            msg.color = data[0].color;
                            msg.id = result[0].maxId + 1;
                            chat.addnewmessage(msg);
                            fs.exists(`public/userImages/${data[0].login}.png`, (ex) => {
                                if (!ex) {
                                    avatar.generate(data[0].login, (data[0].sex ? "male" : "female")).then((image) => {
                                        image.png().toFile(`public/userImages/${data[0].login}.png`);
                                    });
                                }
                            })
                            enter(res, data[0]);
                        })

                    })
                })
            } else {
                res.render("registration.ejs", {
                    notificationType: "Bad",
                    notificationText1: validation.text1,
                    notificationText2: validation.text2
                })
            }
        } else {
            res.render("registration.ejs", {
                notificationType: "Bad",
                notificationText1: "Данный логин уже занят",
                notificationText2: ""
            });
        }
    })
});


function enter(res, user) { //user: login, color, id, scroll
    let token = std.genToken();
    sql.query(`delete from tokens where id = ${user.id}`, (err) => {
        if (err) console.error(err);
        sql.query(`insert into tokens (id, login, token, time) values (${user.id}, ${sql.escape(user.login)}, ${sql.escape(token)}, NOW());`, (err) => {
            if (err) console.error(err);
            res.cookie("danchat.token", token, {
                path: "/"
            });
            res.cookie("danchat.user.color", user.color, {
                path: "/"
            })
            res.cookie("danchat.user.scroll", user.scroll, {
                path: "/"
            })
            res.redirect("/");
        })
    })
}



app.post("/login", parserURLEncoded, (req, res) => {
    let Rlogin = decodeURIComponent(req.body.login);
    let Rpassword = decodeURIComponent(req.body.password);
    if (!Rlogin || !Rpassword) {
        res.render("login.ejs", {
            notification: "Заполните все поля"
        })
        return;
    }
    sql.query(`select id, login, color, sex, scroll from users where login= ${sql.escape(Rlogin)} and password = ${sql.escape(md5(Rpassword))}`, (err, data) => {
        if (err) console.error(err);
        if (data === undefined || data.length === 0) {
            res.render("login.ejs", {
                notification: "Неверный логин или пароль"
            })
            return;
        }
        enter(res, data[0]);
    })
})



app.get("/", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            sql.query(`select login from tokens where time >= (NOW() - INTERVAL 5 MINUTE)`, (err, data) => {
                if (err) console.error(err);
                res.render("chat.ejs", {
                    login: u.login,
                    onlineCounter: data.length
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



app.post("/message", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let message = req.body.message.trim();
            if (message.length > 1000) {
                res.json(new ResponseObject(false, "Длина сообщения не должна превышать 1000 символов"));
                return;
            }
            if (message.length === 0 || !message) {
                res.json(new ResponseObject(false, "Пустое сообщение"));
                return;
            }
            sql.query(`select COUNT(id) as k1 from chat where user_id = ${u.id} and time >= (NOW() - INTERVAL 5 SECOND)
         union select COUNT(id) as k2 from chat where user_id = ${u.id} and time >= (NOW() - INTERVAL 1 MINUTE)`, (err, rp) => {
                if (err) console.error(err);
                if (rp !== undefined && (rp[0].k1 > 10 || rp[0].k2 > 60)) {
                    res.json(new ResponseObject(false, "Не спамить!"));
                    return;
                }
                sql.query(`select color from users where id = ${u.id}`, (err, result) => {
                    if (err) console.error(err);
                    sql.query(`select max(id) as maxId from chat`, (err, data) => {
                        let msg = {};
                        msg.type = "message";
                        io.emit("chatMessage", msg);
                        msg.user_id = u.id;
                        msg.login = u.login;
                        msg.color = result[0].color;
                        msg.id = data[0].maxId + 1;
                        msg.text = message;
                        chat.addnewmessage(msg);
                        res.json(new ResponseObject(true));
                    })
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
            const portion = 50;
            let msgId = parseInt(req.body.id);
            if (msgId === -1) {
                sql.query(`select login, color, id, DATE_FORMAT(time, '%H:%i:%S') as time, DATE_FORMAT(time, '%d.%m.%Y') as date, type, text from chat
            where id >= ((select max(id) from chat)-${portion-1}) order by id desc limit ${portion}`, (err, data) => {
                    if (err) console.error(err);
                    res.json(data);
                })
            } else {
                let msgStart = msgId - portion;
                let msgEnd = msgId - 1;
                sql.query(`select login, color, id, type, text, DATE_FORMAT(time, '%H:%i:%S') as time, DATE_FORMAT(time, '%d.%m.%Y') as date
            from chat where id between ${msgStart} and ${msgEnd} order by id desc limit ${portion}`, (err, data) => {
                    if (err) console.error(err);
                    res.json(data);
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
            let obj = {
                login: u.login
            };
            sql.query(`select COUNT(from_id) as reqs from friends_requests where to_id = ${u.id} union
         all select COUNT(to_id) from friends_requests where from_id = ${u.id}`, (err, data) => {
                if (err) console.error(err);
                obj.inreqsCounter = data[0].reqs ? ` ${data[0].reqs} ` : "";
                obj.outreqsCounter = data[1].reqs ? ` ${data[1].reqs} ` : "";
                sql.query(`select login, color, imgStatus, firstname, lastname from users where id in
                     (select id_1 as ids from friends where id_2 = ${u.id} union select id_2 as ids from friends where id_1 = ${u.id})`, (err, dt) => {
                    if (err) console.error(err);
                    obj.friends = (dt === undefined ? [] : dt);
                    res.render("friends.ejs", obj);
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
            let obj = {
                login: u.login
            };
            sql.query(`select COUNT(to_id) as reqs from friends_requests where from_id = ${u.id}`, (err, result) => {
                if (err) console.error(err);
                obj.outreqsCounter = result[0].reqs ? ` ${result[0].reqs} ` : "";
                sql.query(`select login, color, imgStatus, firstname, lastname from users
               where id in (select from_id from friends_requests where to_id = ${u.id})`, (err, data) => {
                    if (err) console.error(err);
                    obj.inreqs = (data === undefined ? [] : data);
                    res.render("incoming.ejs", obj);
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
            let obj = {
                login: u.login
            };
            sql.query(`select COUNT(from_id) as reqs from friends_requests where to_id = ${u.id}`, (err, result) => {
                if (err) console.error(err);
                obj.inreqsCounter = result[0].reqs ? ` ${result[0].reqs} ` : "";
                sql.query(`select login, color, imgStatus, firstname, lastname from users
               where id in (select to_id from friends_requests where from_id = ${u.id})`, (err, data) => {
                    if (err) console.error(err);
                    obj.outreqs = (data === undefined ? [] : data);
                    res.render("outcoming.ejs", obj);
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
            sql.query(`select login, admin as isAdmin, color, firstname, lastname, imgStatus from users where id = ${u.id}`, (err, data) => {
                res.render("profile.ejs", data[0]);
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



setInterval(() => {
    sql.query(`delete from tokens where time < (NOW() - INTERVAL 1 DAY)`, (err) => {
        if (err) console.error(err);
    })
}, 3600000) // 1 hour



app.get("/onlineCounter", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            sql.query(`select login from tokens where time >= (NOW() - INTERVAL 5 MINUTE)`, (err, data) => {
                if (err) console.error(err);
                res.json(data);
            })
        }
    })
});



app.get("/people", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            sql.query(`select login, firstname, lastname, color, imgStatus from users`, (err, data) => {
                if (err) console.error(err);
                res.render("people.ejs", {
                    login: u.login,
                    people: data
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
            let userLogin = req.params.userLogin;
            sql.query(`select id, login, firstname, lastname, color, DATE_FORMAT(birthdate, '%d.%m.%Y') as birthdate, (DATE_FORMAT(FROM_DAYS(TO_DAYS(now()) - TO_DAYS(birthdate)), '%Y') + 0) as age, sex, imgStatus from users where login = ${sql.escape(userLogin)}`, (err, data) => {
                if (err) console.error(err);
                if (data === undefined || data.length === 0) {
                    res.render("404.ejs", {
                        message: "This user does not exist",
                        login: u.login
                    })
                    return;
                } else {
                    let obj = {
                        imgStatus: data[0].imgStatus,
                        userLogin: data[0].login,
                        firstname: data[0].firstname,
                        lastname: data[0].lastname,
                        color: data[0].color,
                        age: data[0].age,
                        birthdate: data[0].birthdate,
                        login: u.login,
                        sex: (data[0].sex ? "Мужской" : "Женский")
                    }
                    sql.query(`select login from tokens where time >= (NOW() - INTERVAL 5 MINUTE) and id = ${data[0].id}`, (err, respose) => {
                        if (err) console.error(err);
                        if (respose === undefined || respose.length === 0) {
                            obj.userOnlineStatus = "offline";
                        } else {
                            obj.userOnlineStatus = "online";
                        }
                        sql.query(`select login, color, imgStatus, firstname, lastname from users where id in
                  (select id_1 as ids from friends where id_2 = ${data[0].id} union
                  select id_2 as ids from friends where id_1 = ${data[0].id})`, (err, dt2) => {
                            if (err) console.error(err);
                            obj.friends = (dt2 === undefined ? [] : dt2);
                            if (u.login !== data[0].login) {
                                sql.query(`select * from friends where (id_1 = ${u.id} and id_2 = ${data[0].id}) or
                     (id_2 = ${u.id} and id_1 = ${data[0].id})`, (err, r1) => {
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

                    })
                }
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



app.post("/admin/make/admin", parserURLEncoded, (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            sql.query(`update users set admin = 1 where login = ${sql.escape(decodeURIComponent(req.body.login))}`, (err) => {
                if (err) console.error(err);
                res.json(new ResponseObject(true));
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



app.post("/admin/make/user", parserJSON, (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            if (decodeURIComponent(req.body.login) === "admin") {
                res.end();
                return;
            }
            sql.query(`update users set admin = 0 where login = ${sql.escape(decodeURIComponent(req.body.login))}`, (err) => {
                if (err) console.error(err);
                res.json(new ResponseObject(true));
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



app.post("/admin/message", parserJSON, (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            io.emit("ADMINMESSAGE", decodeURIComponent(req.body.message));
            res.json(new ResponseObject(true));
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



app.get("/adminpanel", (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            res.render("adminpanel.ejs", {
                login: u.login
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



app.post("/user/add/friend", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            sql.query(`select id from users where login = ${sql.escape(req.body.login)}`, (err, dt1) => {
                if (err) console.error(err);
                if (dt1 === undefined || dt1.length === 0) {
                    res.send("Incorrect login");
                    return;
                }
                let userId = dt1[0].id;
                sql.query(`insert into friends_requests(from_id, to_id) values (${u.id}, ${userId})`, (err) => {
                    if (err) console.error(err);
                    sql.query(`select token from tokens where id = ${userId}`, (err, data) => {
                        if (err) console.error(err);
                        if (data === undefined || data.length === 0) {
                            res.json(new ResponseObject(true));
                        } else {
                            sql.query(`select login, firstname, lastname, color, sex from users where id = ${u.id}`, (err, dt2) => {
                                if (err) console.error(err);
                                io.emit(data[0].token, {
                                    type: "newIncomingRequest",
                                    login: dt2[0].login,
                                    name: `${dt2[0].firstname} ${dt2[0].lastname}`,
                                    color: dt2[0].color,
                                    sex: dt2[0].sex
                                })
                                res.json(new ResponseObject(true));
                            })
                        }
                    })
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
                let userId = dt1[0].id;
                sql.query(`select * from friends_requests where from_id = ${u.id} and to_id = ${userId}`, (err, dt2) => {
                    if (err) console.error(err);
                    if (dt2 === undefined || dt2.length === 0) {
                        res.send("No requests to cancel");
                        return;
                    }
                    sql.query(`delete from friends_requests where from_id = ${u.id} and to_id = ${userId}`, (err, dt3) => {
                        if (err) console.error(err);
                        res.json(new ResponseObject(true));
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
                let userId = dt1[0].id;
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
                            sql.query(`select token from tokens where id = ${userId}`, (err, data) => {
                                if (err) console.error(err);
                                if (data === undefined || data.length === 0) {
                                    res.json(new ResponseObject(true));
                                } else {
                                    sql.query(`select login, firstname, lastname, sex, color from users where id = ${u.id}`, (err, dt2) => {
                                        if (err) console.error(err);
                                        io.emit(data[0].token, {
                                            type: "acceptOutcomingRequest",
                                            login: dt2[0].login,
                                            name: `${dt2[0].firstname} ${dt2[0].lastname}`,
                                            color: dt2[0].color,
                                            sex: dt2[0].sex
                                        })
                                        res.json(new ResponseObject(true));
                                    })
                                }
                            })
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
                let friendId = dt1[0].id;
                sql.query(`delete from friends where (id_1 = ${u.id} and id_2 = ${friendId}) or (id_2 = ${u.id} and id_1 = ${friendId})`, (err) => {
                    if (err) console.error(err);
                    sql.query(`insert into friends_requests (from_id, to_id) values (${friendId}, ${u.id})`, (err) => {
                        if (err) console.error(err);
                        sql.query(`select token from tokens where id = ${friendId}`, (err, data) => {
                            if (err) console.error(err);
                            if (data === undefined || data.length === 0) {
                                res.json(new ResponseObject(true));
                            } else {
                                sql.query(`select login, firstname, lastname, sex, color from users where id = ${u.id}`, (err, dt2) => {
                                    if (err) console.error(err);
                                    io.emit(data[0].token, {
                                        type: "deletingFromFriends",
                                        login: dt2[0].login,
                                        name: `${dt2[0].firstname} ${dt2[0].lastname}`,
                                        color: dt2[0].color,
                                        sex: dt2[0].sex
                                    })
                                    res.json(new ResponseObject(true));
                                })
                            }
                        })
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
                let validation = usMod.passwordValidate(res, data[0].password, req.body.oldPassword, req.body.newPassword, req.body.repeatNewPassword)
                if (validation.status) {
                    sql.query(`update users set password = ${sql.escape(md5(req.body.newPassword))} where id = ${u.id}`, (err) => {
                        if (err) console.error(err);
                        res.json(new ResponseObject(true, "Пароль успешно изменён!"));
                    })
                } else {
                    res.json(new ResponseObject(false, validation.text1, validation.text2));
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
            let validation = usMod.nameValidate(res, req.body.firstname, req.body.lastname)
            if (validation.status) {
                sql.query(`update users set firstname = ${sql.escape(req.body.firstname)}, lastname = ${sql.escape(req.body.lastname)}
            where id = ${u.id}`, (err) => {
                    if (err) console.error(err);
                    res.json(new ResponseObject(true, "Данные успешно сохранены!"));
                })
            } else {
                res.json(new ResponseObject(false, validation.text1, validation.text2));
            }
        }
    }, (err) => {
        res.end("DB ERROR");
    });
});



app.post("/user/change/settings", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let validation = usMod.validateSetting(req.body);
            if (!validation.status) {
                res.json(new ResponseObject(false, validation.text1, validation.text2));
                return;
            }
            sql.query(`update users set scroll = ${req.body.scroll}, color = ${sql.escape(req.body.color)}
         where id = ${u.id}`, (err, data) => {
                if (err) console.error(err);
                res.cookie("danchat.user.scroll", req.body.scroll ? 1 : 0, {
                    path: "/"
                });
                res.json(new ResponseObject(true, "Настройки успешно обновлены"));
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



app.get("/logout", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            sql.query(`delete from tokens where id = ${u.id}`, (err) => {
                if (err) console.error(err);
                res.clearCookie("danchat.token");
                res.clearCookie("danchat.user.color");
                res.clearCookie("danchat.user.scroll");
                res.redirect("/login");
                res.end();
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})





app.post("/console/sql/query", parserJSON, (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            console.log(req.body.q);
            sql.query(req.body.q, (err, result, fields) => {
                if (err) console.error(err);
                console.log(result);
                res.json(result);
            })
        }
    }, (err) => {
        res.end("DB ERROR");
    });
})



http.listen(process.env.PORT || 5000, (err) => {
    console.timeEnd("Loading");
    console.log(`Started on :${process.env.PORT || 5000}`);
});
