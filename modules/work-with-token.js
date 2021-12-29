'use strict';
console.time("Module => work-with-token");
const db = require("./database");
const std = require("./standard");


exports.validate = (req, res, isAdmin = false) => {
    return new Promise((resolve, reject) => {
        let token = std.getCookie(req, "danchat.token");
        if (!token) {
            clearCookieAndRedirect(res);
            resolve(false);
            return;
        }
        db.getUserByToken(token).then((user) => {
            if (isAdmin && !user.isAdmin) {
                clearCookieAndRedirect(res);
                resolve(false);
                return;
            }
            resolve(user);
            db.updateTokenTime(token).catch((err) => {
                console.error(err);
            });
        }, (err) => {
            console.error(err);
            clearCookieAndRedirect(res);
            reject(false);
        })
    });
}

function clearCookieAndRedirect(res) {
    res.clearCookie("danchat.token");
    res.clearCookie("danchat.user.color");
    res.redirect("/login");
}

console.timeEnd("Module => work-with-token");
