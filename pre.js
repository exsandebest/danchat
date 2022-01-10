'use strict';
const fs = require("fs");
const db = require("./modules/database");
const avatarGenerator = require('avatar-generator');
const avatar = new avatarGenerator();

new Promise((resolve, reject) => {
    fs.exists("public/userImages", (ex) => {
        if (!ex) {
            fs.mkdir("public/userImages", (err) => {
                if (err) console.error(err);
                resolve();
            });
        }
        resolve();
    })
}).then(() => {
    db.getUsersForAvatars().then((users) => {
        users.forEach((user) => {
            avatar.generate(user.login, user.sex).then((image) => {
                image.png().toFile(`public/userImages/${user.login}.png`);
            });
        });
    }, (err) => {
        console.error(err);
    })
})
