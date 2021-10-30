'use strict';
console.time("Module => work-with-token");
const sql = require("./database");
const std = require("./standard");


exports.validate = (req, res, isAdmin = false) => {
    return new Promise((resolve, reject) => {
        let token = std.getCookie(req, "danchat.token");
        if (token) {
            sql.query(`select user_id from tokens where token = ${sql.escape(token)}`, (err, result) => {
                if (err) {
                    console.error(err);
                    reject("db");
                }
                if (result === undefined || result.length === 0) {
                    res.clearCookie("danchat.token");
                    res.redirect("/login");
                    resolve(false);
                } else {
                    sql.query(`select login from users where id = ${result[0].user_id}${isAdmin ? " and admin = 1" : ""}`, (err, data) => {
                        if (err) {
                            console.error(err);
                            reject("db");
                        }
                        if (data === undefined || data.length === 0) {
                            res.clearCookie("danchat.token");
                            res.redirect("/login");
                            resolve(false);
                        } else {
                            let obj = {
                                id: result[0].user_id,
                                login: data[0].login
                            }
                            sql.query(`update tokens set time = NOW() where user_id = ${obj.id}`, (err) => {
                                if (err) {
                                    console.error(err);
                                    reject("db");
                                }
                                resolve(obj);
                            })
                        }
                    })
                }
            })
        } else {
            res.clearCookie("danchat.token");
            res.redirect("/login");
            resolve(false);
        }
    });
}
console.timeEnd("Module => work-with-token");
