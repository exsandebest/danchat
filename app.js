'use strict';
console.time("Loading");
console.log("Loading...");
if (!process.env.USING_SERVER) {
    require('dotenv').config({
        path: "config/.env"
    });
}
require("./pre");
const CONSTANTS = require("./modules/constants");
const fs = require("fs");
const cookieParser = require('cookie-parser');
const pars = require('body-parser');
const bcrypt = require('bcrypt');
const avatarGenerator = require('avatar-generator');
const avatar = new avatarGenerator();
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {allowEIO3: true});
const chat = require('./modules/chat');
const wwt = require('./modules/work-with-token');
const db = require("./modules/database");
const usMod = require('./modules/user-module');
const std = require("./modules/standard");
const ResponseObject = require("./modules/ResponseObject");
const {isAbsolute} = require("express/lib/utils");
const parserURLEncoded = pars.urlencoded({
    extended: false
});
const parserJSON = pars.json();

app.use(express.static(__dirname + "/public", {
    maxAge: CONSTANTS.EXPRESS_STATIC_PUBLIC_TIME
}));
app.use(cookieParser());
app.set("view engine", "ejs");


app.get("/login", (req, res) => {
    res.clearCookie(CONSTANTS.COOKIE_NAME_TOKEN);
    res.clearCookie(CONSTANTS.COOKIE_NAME_USER_COLOR);
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
    let validation = usMod.registrationValidate(req.body);
    if (!validation.status) {
        res.render("registration.ejs", {
            notificationType: "Bad",
            notificationText1: validation.text1,
            notificationText2: validation.text2
        })
        return;
    }
    let login = req.body.login;
    db.isLoginUsed(login).then((result) => {
        if (result) {
            res.render("registration.ejs", {
                notificationType: "Bad",
                notificationText1: "Данный логин уже занят",
                notificationText2: ""
            });
            return;
        }
        let user = req.body;
        user.birthdate = user.birthdate.split(".").reverse().join("-");
        user.sex = parseInt(user.sex);
        user.password = bcrypt.hashSync(user.password, CONSTANTS.BCRYPT_SALT_ROUNDS);
        user.color = CONSTANTS.DEFAULT_USER_COLOR;
        db.registerUser(user).then((userId) => {
            let msg = {};
            msg.type = "registration";
            msg.user_id = userId;
            msg.login = user.login;
            msg.color = user.color;
            chat.addNewMessage(msg);
            io.emit("chatMessage", {type: "registration"});
            fs.exists(`public/userImages/${user.login}.png`, (ex) => {
                if (!ex) {
                    avatar.generate(user.login, (user.sex ? "male" : "female")).then((image) => {
                        image.png().toFile(`public/userImages/${user.login}.png`);
                    }, (err) => {
                        console.error(err);
                    });
                }
            })
            enter(res, {
                id: userId,
                color: user.color
            });
        }, (err) => {
            console.error(err);
        })
    }, (err) => {
        console.error(err);
    })
});


function enter(res, user) { //user: color, id
    let token = std.genToken();
    db.enter(user.id, token).then(() => {
        res.cookie(CONSTANTS.COOKIE_NAME_TOKEN, token, {
            path: "/"
        });
        res.cookie(CONSTANTS.COOKIE_NAME_USER_COLOR, user.color, {
            path: "/"
        });
        res.redirect("/");
    }, (err) => {
        console.error(err);
    })
}


app.post("/login", parserURLEncoded, (req, res) => {
    let userLogin = decodeURIComponent(req.body.login);
    let userPassword = decodeURIComponent(req.body.password);
    if (!userLogin || !userPassword) {
        res.render("login.ejs", {
            notification: "Заполните все поля"
        })
        return;
    }
    db.authorizeUser(userLogin, userPassword).then((user) => {
        if (!user.valid) {
            res.render("login.ejs", {
                notification: "Неверный логин или пароль"
            })
            return;
        }
        enter(res, user);
    }, (error) => {
        console.error(error);
    })
})


app.get("/", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getOnlineUsersCount().then((onlineCounter) => {
                res.render("chat.ejs", {
                    login: u.login,
                    isAdmin: u.isAdmin,
                    onlineCounter: onlineCounter
                })
            }, (error) => {
                console.error(error);
                res.render("chat.ejs", {
                    login: u.login,
                    isAdmin: u.isAdmin,
                    onlineCounter: "#"
                })
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.get("/subscribe", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            chat.subscribe(req, res);
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
});


app.post("/message", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let message = req.body.message.trim();
            if (message.length > CONSTANTS.MESSAGE_SYMBOLS_LIMIT) {
                res.json(new ResponseObject(false, "Длина сообщения не должна превышать 1000 символов"));
                return;
            }
            if (message.length === 0 || !message) {
                res.json(new ResponseObject(false, "Пустое сообщение"));
                return;
            }
            db.getUserColor(u.id).then((color) => {
                let msg = {};
                msg.type = "message";
                msg.user_id = u.id;
                msg.login = u.login;
                msg.color = color;
                msg.text = message;
                chat.addNewMessage(msg);
                io.emit("chatMessage", {type: "message"});
                res.json(new ResponseObject());
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
});


app.post("/get/message", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let msgId = parseInt(req.body.id);
            db.getMessages(msgId, CONSTANTS.MESSAGES_BATCH_SIZE).then((messages) => {
                res.json(messages);
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.errror(err);
        res.end("DB ERROR");
    });
})


app.get("/friends", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getFriendsRequestsCount(u.id).then((result) => {
                db.getFriends(u.id).then((friends) => {
                    res.render("friends.ejs", {
                        login: u.login,
                        inreqsCounter: result.inReqsCount ? ` ${result.inReqsCount} ` : "",
                        outreqsCounter: result.outReqsCount ? ` ${result.outReqsCount} ` : "",
                        friends: friends
                    });
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.get("/incoming", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getFriendsRequestsCount(u.id).then((result) => {
                db.getIncomingRequests(u.id).then((inreqs) => {
                    res.render("incoming.ejs", {
                        login: u.login,
                        outreqsCounter: result.outReqsCount ? ` ${result.outReqsCount} ` : "",
                        inreqs: inreqs
                    });
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
});


app.get("/outcoming", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getFriendsRequestsCount(u.id).then((result) => {
                db.getOutcomingRequests(u.id).then((outreqs) => {
                    res.render("outcoming.ejs", {
                        login: u.login,
                        inreqsCounter: result.inReqsCount ? ` ${result.inReqsCount} ` : "",
                        outreqs: outreqs
                    });
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
});


app.get("/profile", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getUserProfile(u.id).then((data) => {
                res.render("profile.ejs", data);
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.get("/people", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getPeople().then((users) => {
                res.render("people.ejs", {
                    login: u.login,
                    people: users
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.get("/u/:userLogin", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let userLogin = decodeURIComponent(req.params.userLogin);
            console.log(userLogin);
            db.getUser(userLogin).then((user) => {
                if (!user.valid) {
                    res.render("404.ejs", {
                        login: u.login,
                        message: "Такого пользователя не существует"
                    })
                    return;
                }
                db.getUserOnlineStatus(user.id).then((userOnlineStatus) => {
                    db.getFriends(user.id, CONSTANTS.PROFILE_FRIENDS_DISPLAY_LIMIT).then((friends) => {
                        let renderObject = {
                            login: u.login,
                            imgStatus: user.imgStatus,
                            userLogin: user.login,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            color: user.color,
                            age: user.age,
                            birthdate: user.birthdate,
                            sex: user.sex,
                            userOnlineStatus: userOnlineStatus,
                            friends: friends
                        }
                        if (user.id === u.id) {
                            renderObject.userStatus = "self";
                            res.render("user.ejs", renderObject);
                            return;
                        }
                        db.getUsersRelationship(u.id, user.id).then((relationship) => {
                            console.log(relationship);
                            renderObject.userStatus = relationship;
                            res.render("user.ejs", renderObject);
                        }, (err) => {
                            console.error(err);
                        })
                    }, (err) => {
                        console.error(err);
                    })
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/admin/make/admin", parserJSON, (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            let login = decodeURIComponent(req.body.login);
            console.log(login);
            db.changePermissions(login, 1).then(() => {
                res.json(new ResponseObject(true));
            }, (error) => {
                console.error(error);
                res.json(new ResponseObject(false, "DB Error"))
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/admin/make/user", parserJSON, (req, res) => {
    wwt.validate(req, res, true).then((u) => {
        if (u) {
            let login = decodeURIComponent(req.body.login);
            if (login === "admin") {
                res.json(new ResponseObject(false, "Cannot change admin's permission"));
                return;
            }
            db.changePermissions(login, 0).then(() => {
                res.json(new ResponseObject(true));
            }, (error) => {
                console.error(error);
                res.json(new ResponseObject(false, "DB Error"))
            })
        }
    }, (err) => {
        console.error(err);
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
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/admin/delete/message", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.getUserPermissions(u.id).then((isAdmin) => {
                if (!isAdmin) {
                    res.json(new ResponseObject());
                    return;
                }
                let msgId = parseInt(req.body.messageId);
                if (msgId === undefined || isNaN(msgId)) {
                    res.json(new ResponseObject(false, "Incorrect Message Id"));
                    return;
                }
                db.deleteMessage(msgId).then(() => {
                    io.emit("deleteMessage", {
                        messageId: msgId
                    })
                    res.json(new ResponseObject());
                }, (err) => {
                    console.error(err);
                })
            })
        }
    }, (err) => {
        console.error(err);
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
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/user/add/friend", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {

            let userLogin = decodeURIComponent(req.body.login);
            db.getUserIdByLogin(userLogin).then((user) => {
                if (!user.valid) {
                    res.send("Incorrect login");
                    return;
                }
                db.getUsersRelationship(u.id, user.id).then((relationship) => {
                    if (relationship !== "default") {
                        res.send("Request already sent or you have already friendship");
                        return;
                    }
                    db.sendFriendsRequest(u.id, user.id).then(() => {
                        res.json(new ResponseObject());
                    }, (err) => {
                        console.error(err);
                    })
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/user/cancel/outcomingrequest", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let userLogin = decodeURIComponent(req.body.login);
            db.getUserIdByLogin(userLogin).then((user) => {
                if (!user.valid) {
                    res.send("Incorrect login");
                    return;
                }
                db.getUsersRelationship(u.id, user.id).then((relationship) => {
                    if (relationship !== "request sent") {
                        res.send("No requests to cancel");
                        return;
                    }
                    db.cancelOutcomingRequest(u.id, user.id).then(() => {
                        res.json(new ResponseObject());
                    }, (err) => {
                        console.error(err);
                    })
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/user/accept/incomingrequest", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let userLogin = decodeURIComponent(req.body.login);
            db.getUserIdByLogin(userLogin).then((user) => {
                if (!user.valid) {
                    res.send("Incorrect login");
                    return;
                }
                db.getUsersRelationship(u.id, user.id).then((relationship) => {
                    if (relationship !== "subscriber") {
                        res.send("No requests to accept");
                        return;
                    }
                    db.acceptIncomingRequest(user.id, u.id).then(() => {
                        res.json(new ResponseObject());
                    }, (err) => {
                        console.error(err);
                    })
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/user/delete/friend", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let userLogin = decodeURIComponent(req.body.login);
            db.getUserIdByLogin(userLogin).then((user) => {
                if (!user.valid) {
                    res.send("Incorrect login");
                    return;
                }
                db.deleteFriendship(u.id, user.id).then(() => {
                    res.json(new ResponseObject());
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.post("/user/change/password", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let oldPassword = decodeURIComponent(req.body.oldPassword);
            let newPassword = decodeURIComponent(req.body.newPassword);
            let repeatNewPassword = decodeURIComponent(req.body.repeatNewPassword);

            let validation = usMod.passwordValidate(oldPassword, newPassword, repeatNewPassword);
            if (!validation.status) {
                res.json(new ResponseObject(false, validation.text1, validation.text2));
                return;
            }
            db.checkUserPassword(u.id, oldPassword).then((isPasswordCorrect) => {
                if (!isPasswordCorrect) {
                    res.json(new ResponseObject(false, "Неверный текущий пароль"));
                    return;
                }
                db.checkUserPassword(u.id, newPassword).then((isPasswordTheSame) => {
                    if (isPasswordTheSame) {
                        res.json(new ResponseObject(false, "Новый пароль совпадает со старым"));
                        return;
                    }
                    db.updateUserPassword(u.id, newPassword).then(() => {
                        res.json(new ResponseObject(true, "Пароль успешно изменён!"));
                    }, (err) => {
                        console.error(err);
                    })
                }, (err) => {
                    console.error(err);
                })
            }, (err) => {
                console.error(err);
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
});


app.post("/user/change/name", parserJSON, (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            let firstname = decodeURIComponent(req.body.firstname);
            let lastname = decodeURIComponent(req.body.lastname);
            let validation = usMod.nameValidate(firstname, lastname);
            if (validation.status) {
                db.changeName(u.id, firstname, lastname).then(() => {
                    res.json(new ResponseObject(true, "Данные успешно сохранены!"));
                }, (error) => {
                    res.json(new ResponseObject(false, "Error", error));
                })
            } else {
                res.json(new ResponseObject(false, validation.text1, validation.text2));
            }
        }
    }, (err) => {
        console.error(err);
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
            db.changeSettings(u.id, req.body.color).then(() => {
                res.json(new ResponseObject(true, "Настройки успешно обновлены"));
            }, (error) => {
                res.json(new ResponseObject(false, "Error", error));
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


app.get("/logout", (req, res) => {
    wwt.validate(req, res).then((u) => {
        if (u) {
            db.logout(u.id).finally(() => {
                res.clearCookie(CONSTANTS.COOKIE_NAME_TOKEN);
                res.clearCookie(CONSTANTS.COOKIE_NAME_USER_COLOR);
                res.redirect("/login");
                res.end();
            })
        }
    }, (err) => {
        console.error(err);
        res.end("DB ERROR");
    });
})


http.listen(process.env.PORT || CONSTANTS.DEFAULT_PORT, (err) => {
    if (err) console.log(err);
    console.timeEnd("Loading");
    console.log(`Started on :${process.env.PORT || CONSTANTS.DEFAULT_PORT}`);
});
