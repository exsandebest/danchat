'use strict';
console.time("Module => work-with-token");
const CONSTANTS = require("./constants");
const db = require("./database");
const std = require("./standard");


exports.validate = (req, res, isAdmin = false) => {
    return new Promise((resolve, reject) => {
        let token = std.getCookie(req, CONSTANTS.COOKIE_NAME_TOKEN);
        if (!token) {
            clearCookieAndRedirect(res);
            resolve(false);
            return;
        }
        db.getUserByToken(token).then((user) => {
            if (!user.valid) {
                clearCookieAndRedirect(res);
                resolve(false);
                return;
            }
            if (isAdmin && !user.isAdmin) {
                clearCookieAndRedirect(res);
                resolve(false);
                return;
            }
            delete user.valid;
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
    res.clearCookie(CONSTANTS.COOKIE_NAME_TOKEN);
    res.clearCookie(CONSTANTS.COOKIE_NAME_USER_COLOR);
    res.redirect("/login");
}

console.timeEnd("Module => work-with-token");
