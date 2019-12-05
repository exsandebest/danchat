console.time("Module => work-with-token");
var logins = [];
var tokens = [];
const fs = require("fs");
const wwt = require("../work-with-token");
start();

function start(){
  try{
  logins = [];
  tokens = [];
  var data = fs.readFileSync("data/tokens.txt", "utf-8");
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

fs.watch("data/tokens.txt", (event) => {
  if (event === "change") {
    logins = [];
    tokens = [];
    var data = fs.readFileSync("data/tokens.txt", "utf-8");
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
  fs.readFile("data/tokens.txt","utf-8",(err,data)=>{
    if (data == false) data = "[]";
    var arr = JSON.parse(data);
    arr.forEach((elem,i)=>{
      if (elem[login] == token){
        arr.splice(i,1);
      }
    })
    fs.writeFile("data/tokens.txt", JSON.stringify(arr,"",2),(err)=>{
      if (err) throw err;
    })
  })
};



exports.setCouple =  (login, token) => {
  fs.readFile("data/tokens.txt", "utf-8", (err, data)=>{
    if (err) throw err;
    var arr = JSON.parse(data);
    var obj = {};
    obj[login]=token;
    arr.push(obj);
    fs.writeFile("data/tokens.txt",JSON.stringify(arr,"",5), (err)=>{
      if (err) throw err;
    })
  })
};




exports.validate = function (req, res) {
  var token = getCookie(req,"token");
  if (token){
    var login = wwt.getLoginFromToken(token);
    if (login){
      if(fs.existsSync(`userdata/${login}.txt`)){
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
fs.readFile("data/tokens.txt","utf-8",(err,data)=>{
  var tkns = JSON.parse(data);
  tkns.forEach((elem,i)=>{
    for (key in elem){
      if (arr.indexOf(key) == -1){
        tkns.splice(i,1);
      }
    }
  });
  fs.writeFile("data/tokens.txt",JSON.stringify(tkns,"",5),(err)=>{
    if (err) throw err;
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
    if (fs.existsSync(`userdata/${login}.txt`) && login && token && (JSON.parse(fs.readFileSync("data/adminlist.txt","utf-8")).indexOf(login) !== -1)){
          return login;
        } else {
          res.clearCookie("token",{path:"/"});
          res.redirect("/login");
        }

  }





console.timeEnd("Module => work-with-token");
