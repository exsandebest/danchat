console.time("Module => getter");
const fs = require('fs');
const sql = require("../database");

exports.colorOfUser = (login) => {
   if (fs.existsSync(`userdata/${login}.json`)) {
      return JSON.parse(fs.readFileSync(`userdata/${login}.json`, "utf-8")).color;
   }
}

console.timeEnd("Module => getter");
