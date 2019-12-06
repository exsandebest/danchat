console.time("Module => work-with-token");
var logins = [];
var tokens = [];
const fs = require("fs");
const wwt = require("../work-with-token");
const chat = require("../chat");
start();

function start(){
  try{
  logins = [];
  tokens = [];
  var data = fs.readFileSync("data/tokens.json", "utf-8");
  data = data.replace(/\r/g, "");
  data = data.replace(/\n/g, "");
if (data == false) data = "[]";
    var arr = JSON.parse(data);
    arr.forEach((elem,i)=>{
      for (key in arr[i]){
        logins.push(key);
        tokens.push(arr[i][key]);
      }
    })
  } catch(err){
    console.log(err);
  }
}

fs.watch("data/tokens.json", (event) => {
  if (event === "change") {
    logins = [];
    tokens = [];
    var data = fs.readFileSync("data/tokens.json", "utf-8");
    data = data.replace(/\r/g, "");
    data = data.replace(/\n/g, "");
    if (data == false) data = "[]";
    var arr = JSON.parse(data);
    arr.forEach((elem,i)=>{
      for (key in arr[i]){
        logins.push(key);
        tokens.push(arr[i][key]);
      }
    })
  }
})

exports.getLoginFromToken = (token) => {
  return logins[tokens.indexOf(token)];
};



exports.getTokenFromLogin = (login)=>{
return tokens[logins.indexOf(login)];
};



exports.userLogout = (token, login)=>{
  fs.readFile("data/tokens.json","utf-8",(err,data)=>{
    if (data == false) data = "[]";
    var arr = JSON.parse(data);
    arr.forEach((elem,i)=>{
      if (elem[login] == token){
        arr.splice(i,1);
      }
    })
    fs.writeFile("data/tokens.json", JSON.stringify(arr,"",2),(err)=>{
      if (err) throw err;
    })
  })
};



exports.setCouple =  (login, token) => {
  fs.readFile("data/tokens.json", "utf-8", (err, data)=>{
    if (err) throw err;
    var arr = JSON.parse(data);
    var obj = {};
    obj[login]=token;
    arr.push(obj);
    fs.writeFile("data/tokens.json",JSON.stringify(arr,"",5), (err)=>{
      if (err) throw err;
    })
  })
};




exports.validate = function (req, res) {
  var token = getCookie(req,"token");
  if (token){
    var login = wwt.getLoginFromToken(token);
    if (login){
      if(fs.existsSync(`userdata/${login}.json`)){
        return login;
      }
    } else {
    res.clearCookie("token",{path:"/"});
    res.redirect("/login");
    res.end();
    }
  } else {
    res.redirect("/login");
    res.end();
  }
};

exports.clear = (arr)=>{
fs.readFile("data/tokens.json","utf-8",(err,data)=>{
  var tkns = JSON.parse(data);
  tkns.forEach((token,i)=>{
    for (login in token){
      if (arr.indexOf(login) == -1){
        wwt.userLogout(wwt.getTokenFromLogin(login),login);
        fs.readFile(`userdata/${login}.json`, "utf-8", (err, data2)=>{
          chat.addnewmessage("exit",JSON.parse(data2));
        })
      }
    }
  });
});
}

function getCookie(req,name) {
   try {
        var matches = req.headers.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : false;
       } catch (e){
       return false;
   }
}





exports.validateAdmin = (req,res)=>{
    var token = getCookie(req,"token");
    var login = wwt.getLoginFromToken(token);
    if (fs.existsSync(`userdata/${login}.json`) && login && token && (JSON.parse(fs.readFileSync("data/adminlist.json","utf-8")).indexOf(login) !== -1)){
          return login;
        } else {
          res.clearCookie("token",{path:"/"});
          res.redirect("/login");
        }

  }





console.timeEnd("Module => work-with-token");
