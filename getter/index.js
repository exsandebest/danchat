console.time("Module => getter");
const fs = require('fs');

exports.GUID = ()=>{
  return Number(fs.readFileSync("data/GUID.id","utf-8").replace("\n","").replace("\r",""));
}


exports.colorOfUser = (login)=>{
if (fs.existsSync(`userdata/${login}.json`)){
  return JSON.parse(fs.readFileSync(`userdata/${login}.json`,"utf-8")).color;
}
}
console.timeEnd("Module => getter");
