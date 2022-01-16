'use strict';
console.time("Module => database");
const CONSTANTS = require("./constants");
const mysql = require("mysql2");
const bcrypt = require('bcrypt');
const queries = require("./queries");

const sql = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
})

sql.query(queries.getCreateTableUsersQuery(), (err) => {
    if (err) console.error(err);
    sql.query(queries.getCreateAdminAccountQuery(
        CONSTANTS.DEFAULT_ADMIN_LOGIN,
        CONSTANTS.DEFAULT_ADMIN_PASSWORD,
        CONSTANTS.DEFAULT_ADMIN_NAME,
        CONSTANTS.DEFAULT_ADMIN_AGE
    ), (err) => {
        if (err) console.error(err);
        sql.query(queries.getCreateTableFriendsQuery(), (err) => {
            if (err) console.error(err);
            sql.query(queries.getCreateTableFriendsRequestsQuery(), (err) => {
                if (err) console.error(err);
                sql.query(queries.getCreateTableTokensQuery(), (err) => {
                    if (err) console.error(err);
                    sql.query(queries.getCreateTableChatQuery(), (err) => {
                        if (err) console.error(err);
                    })
                })
            })
        })
    })
})

exports.escape = (s) => {
    return sql.escape(s);
}

setInterval(() => {
    sql.query(`delete
               from tokens
               where time < (NOW() - INTERVAL ${CONSTANTS.TOKEN_EXPIRATION_INTERVAL})`, (err) => {
        if (err) console.error(err);
    })
}, CONSTANTS.TOKEN_EXPIRATION_UPDATE_INTERVAL)

exports.authorizeUser = (login, password) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getAuthorizeUserQuery(login), (err, data) => {
            if (err) {
                console.error(err);
                reject("authorizeUser: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                resolve({
                    valid: false,
                    reason: "authorizeUser: Login not found"
                });
                return;
            }
            let user = data[0];
            if (!bcrypt.compareSync(password, user.password)) {
                resolve({
                    valid: false,
                    reason: "authorizeUser: Incorrect password"
                });
                return;
            }
            user.valid = true;
            delete user["password"];
            resolve(user);
        })
    });
}

exports.getOnlineUsersCount = () => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getOnlineUsersCountQuery(), (err, data) => {
            if (err) {
                console.error(err);
                reject("getOnlineUsersCount: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getOnlineUsersCount: Data undefined")
                return;
            }
            resolve(data[0].onlineCounter);
        })
    });
}

exports.getUserProfile = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserProfileQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUserProfile: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getUserProfile: Data undefined")
                return;
            }
            resolve(data[0]);
        })
    });
}

exports.getPeople = () => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getPeopleQuery(), (err, data) => {
            if (err) {
                console.error(err);
                reject("getPeople: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getPeople: Data undefined")
                return;
            }
            resolve(data);
        })
    });
}

exports.getSettings = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getSettingsQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getSettings: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getSettings: Data undefined")
                return;
            }
            resolve(data[0]);
        })
    });
}


exports.logout = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getDeleteTokenQuery(id), (err) => {
            if (err) {
                console.error(err);
                reject("logout: DB Error: " + err);
                return;
            }
            resolve();
        })
    });
}


exports.enter = (id, token) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getDeleteTokenQuery(id), (err) => {
            if (err) {
                console.error(err);
                reject("enter: DB Error: " + err);
                return;
            }
            sql.query(queries.getSetTokenQuery(id, token), (err) => {
                if (err) {
                    console.error(err);
                    reject("enter: DB Error: " + err);
                    return;
                }
                resolve();
            })
        })
    });
}

exports.getMessages = (minMsgId, portion) => {
    return new Promise((resolve, reject) => {
        if (minMsgId === -1) {
            sql.query(queries.getLastMessagesQuery(portion), (err, data) => {
                if (err) {
                    console.error(err);
                    reject("getMessages: DB Error: " + err);
                    return;
                }
                if (data === undefined) {
                    resolve([]);
                    return;
                }
                resolve(data);
            })
        } else {
            let startMsgId = minMsgId - portion;
            let endMgsId = minMsgId - 1;
            sql.query(queries.getMessagesIntervalQuery(startMsgId, endMgsId), (err, data) => {
                if (err) {
                    console.error(err);
                    reject("getMessages: DB Error: " + err);
                    return;
                }
                if (data === undefined) {
                    resolve([]);
                    return;
                }
                resolve(data);
            })
        }
    });
}

exports.changePermissions = (login, isAdmin) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getChangePermissionsQuery(login, isAdmin), (err) => {
            if (err) {
                console.error(err);
                reject("changePermissions: DB Error: " + err);
                return;
            }
            resolve();
        })
    })
}


exports.changeName = (id, firstname, lastname) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getChangeNameQuery(id, firstname, lastname), (err) => {
            if (err) {
                console.error(err);
                reject("changeName: DB Error: " + err);
                return;
            }
            resolve();
        })
    })
}

exports.changeSettings = (id, color) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getChangeSettingsQuery(id, color), (err) => {
            if (err) {
                console.error(err);
                reject("changeSettings: DB Error: " + err);
                return;
            }
            resolve();
        })
    })
}

exports.getUserColor = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserColorQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUserColor: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getUserColor: Data undefined")
                return;
            }
            resolve(data[0].color || CONSTANTS.DEFAULT_USER_COLOR);
        })
    });
}

exports.registerUser = (user) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getRegisterUserQuery(user), (err, result) => {
            if (err) {
                console.error(err);
                reject("registerUser: DB Error: " + err);
                return;
            }
            resolve(result.insertId);
        })
    })
}

exports.isLoginUsed = (login) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getCheckLoginQuery(login), (err, data) => {
            if (err) {
                console.error(err);
                reject("isLoginUsed: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                resolve(false);
                return;
            }
            resolve(true);
        })
    });
}

exports.getFriendsRequestsCount = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getFriendsRequestsCountQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getFriendsRequestsCount: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getFriendsRequestsCount: Data undefined");
                return;
            }
            resolve({
                inReqsCount: data[0].reqs,
                outReqsCount: data[1].reqs
            });
        })
    });
}

exports.getFriends = (id, limit = 50) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getFriendsQuery(id, limit), (err, data) => {
            if (err) {
                console.error(err);
                reject("getFriends: DB Error: " + err);
                return;
            }
            resolve(data ? data : []);
        })
    });
}

exports.getIncomingRequests = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getIncomingRequestsQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getIncomingRequests: DB Error: " + err);
                return;
            }
            resolve(data ? data : []);
        })
    });
}

exports.getOutcomingRequests = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getOutcomingRequestsQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getOutcomingRequests: DB Error: " + err);
                return;
            }
            resolve(data ? data : []);
        })
    });
}

exports.getUser = (login) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserQuery(login), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUser: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                resolve({valid: false});
                return;
            }
            data[0].valid = true;
            resolve(data[0]);
        })
    });
}

exports.getUserOnlineStatus = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getCheckIsUserOnlineQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUserOnlineStatus: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getUserOnlineStatus: Data undefined");
                return;
            }
            resolve(data[0].status);
        })
    });
}

exports.getUsersRelationship = (id1, id2) => { // id2 to id1
    return new Promise((resolve, reject) => {
        sql.query(queries.getCheckFriendshipQuery(id1, id2), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUsersRelationship: DB Error: " + err);
                return;
            }
            console.log(data);
            if (data !== undefined && data.length > 0 && data[0].rowFound) {
                resolve("friend");
                return;
            }
            sql.query(queries.getCheckIncomingRequestStatusQuery(id1, id2), (err, data) => {
                if (err) {
                    console.error(err);
                    reject("getUsersRelationship: DB Error: " + err);
                    return;
                }
                if (data !== undefined && data.length > 0 && data[0].rowFound) {
                    resolve("subscriber");
                    return;
                }
                sql.query(queries.getCheckOutcomintRequestStatusQuery(id1, id2), (err, data) => {
                    if (err) {
                        console.error(err);
                        reject("getUsersRelationship: DB Error: " + err);
                        return;
                    }
                    if (data !== undefined && data.length > 0 && data[0].rowFound) {
                        resolve("request sent");
                        return;
                    }
                    resolve("default");
                })
            })
        })
    });
}

exports.checkUserPassword = (id, password) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserPasswordQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("checkUserPassword: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("checkUserPassword: Data undefined");
                return;
            }
            if (!bcrypt.compareSync(password, data[0].password)) {
                resolve(false);
                return;
            }
            resolve(true);
        })
    });
}

exports.updateUserPassword = (id, password) => {
    return new Promise((resolve, reject) => {
        password = bcrypt.hashSync(password, CONSTANTS.BCRYPT_SALT_ROUNDS);
        sql.query(queries.getUpdateUserPasswordQuery(id, password), (err) => {
            if (err) {
                console.error(err);
                reject("updateUserPassword: DB Error: " + err);
                return;
            }
            resolve();
        })
    });
}

exports.getUserByToken = (token) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserByTokenQuery(token), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUserByToken: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                resolve({valid: false});
                return;
            }
            data[0].valid = true;
            resolve(data[0]);
        })
    });
}

exports.updateTokenTime = (token) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUpdateTokenTimeQuery(token), (err) => {
            if (err) {
                console.error(err);
                reject("updateTokenTime: DB Error: " + err);
                return;
            }
            resolve();
        })
    });
}

exports.addMessage = (message) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getAddMessageQuery(message), (err, result) => {
            if (err) {
                console.error(err);
                reject("addMessage: DB Error: " + err);
                return;
            }
            if (result === undefined || result.insertId === undefined) {
                reject("addMessage: Data undefined");
                return;
            }
            resolve(result.insertId);
        })
    });
}

exports.getUserIdByLogin = (login) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserIdByLoginQuery(login), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUserIdByLogin: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                resolve({
                    valid: false,
                    reason: "getUserIdByLogin: Data undefined"
                });
                return;
            }
            data[0].valid = true;
            resolve(data[0]);
        })
    });
}

exports.acceptIncomingRequest = (id_from, id_to) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getDeleteIncomingRequestRowQuery(id_from, id_to), (err) => {
            if (err) {
                console.error(err);
                reject("acceptIncomingRequest: DB Error: " + err);
                return;
            }
            sql.query(queries.getAddFriendshipRowQuery(id_from, id_to), (err) => {
                if (err) {
                    console.error(err);
                    reject("acceptIncomingRequest: DB Error: " + err);
                    return;
                }
                resolve();
            })
        })
    });
}

exports.getTokenByUserId = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getTokenByUserIdQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getTokenByUserId: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                resolve({
                    valid: false,
                    reason: "getTokenByUserId: Data undefined"
                });
                return;
            }
            data[0].valid = true;
            resolve(data[0]);
        })
    });
}

exports.deleteFriendship = (id_sender, id_friend) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getDeleteFriendshipRowQuery(id_sender, id_friend), (err) => {
            if (err) {
                console.error(err);
                reject("deleteFriendship: DB Error: " + err);
                return;
            }
            sql.query(queries.getAddFriendsRequestRowQuery(id_friend, id_sender), (err) => {
                if (err) {
                    console.error(err);
                    reject("deleteFriendship: DB Error: " + err);
                    return;
                }
                resolve();
            })
        })
    });
}

exports.cancelOutcomingRequest = (id_sender, id_user) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getCancelOutcomingRequestQuery(id_sender, id_user), (err) => {
            if (err) {
                console.error(err);
                reject("cancelOutcomingRequest: DB Error: " + err);
                return;
            }
            resolve();
        })
    });
}

exports.sendFriendsRequest = (id_from, id_to) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getAddFriendsRequestRowQuery(id_from, id_to), (err) => {
            if (err) {
                console.error(err);
                reject("sendFriendsRequest: DB Error: " + err);
                return;
            }
            resolve();
        })
    });
}

exports.deleteMessage = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getDeleteMessageQuery(id), (err) => {
            if (err) {
                console.error(err);
                reject("deleteMessage: DB Error: " + err);
                return;
            }
            resolve();
        })
    });
}

exports.getUserPermissions = (id) => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUserPermissionsQuery(id), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUserPermissions: DB Error: " + err);
                return;
            }
            if (data === undefined || data.length === 0) {
                reject("getUserPermissions: Data undefined");
                return;
            }
            resolve(data[0].isAdmin);
        })
    });
}

exports.getUsersForAvatars = () => {
    return new Promise((resolve, reject) => {
        sql.query(queries.getUsersForAvatarsQuery(), (err, data) => {
            if (err) {
                console.error(err);
                reject("getUsersForAvatars: DB Error: " + err);
                return;
            }
            if (data === undefined) {
                resolve([]);
                return;
            }
            resolve(data);
        })
    });
}

console.timeEnd("Module => database");
