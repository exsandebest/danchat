const fs = require("fs");
const sql = require("./modules/database");
const avatarGenerator = require('avatar-generator');
const avatar = new avatarGenerator();

new Promise(function(resolve, reject) {
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
   sql.query("select login, sex from users", (err, data)=>{
      if (err) console.error(err);
      data.forEach((item) => {
         avatar.generate(item.login, (item.sex ? "male" : "female")).then((image)=>{
            image.png().toFile(`public/userImages/${item.login}.png`);
         });
      });
   })
})
