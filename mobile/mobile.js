app.get("/mobile/check/connection", (req, res) => {
   res.send("CONNECT");
});

app.post("/mobile/enter", uep, (req, res) => {
   var auth = fs.existsSync("userdata/" + req.body.login + ".json");
   if (auth === false) {
      res.end("false");
   } else {
      console.log(req.body.login + " is entering...");
      fs.readFile("userdata/" + req.body.login + ".json", "utf-8", (err, data) => {
         if (err != null) {
            res.end("false");
         } else {
            var user = JSON.parse(data);
            if (req.body.login == user.login && req.body.password == user.password) {
               var token = genToken();
               fs.appendFileSync("data/tokens.json", ";" + token + "=" + user.login);
               res.send("true:" + user.login + ":" + token);
               chat.addnewmessage("enter", user);
               console.log(user.login + " entered. IP: " + req.ip);
            } else {
               res.end("false");
            }
         }
      })
   }
});

app.post("/mobile/addnewmessage", uep, (req, res) => {
   var login = wwt.getLoginFromToken(req.body.token);
   if (login) {
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         var user = JSON.parse(data);
         user.message = req.body.message || "";
         chat.addnewmessage("message", user);
         res.send("TRUE");
      })
   } else {
      res.send("NOT LOGIN");
   }
});


app.post("/mobile/subscribe", uep, (req, res) => {
   var login = wwt.getLoginFromToken(req.body.token);
   if (login) {
      chat.subscribe(req, res);
   } else {
      res.send("NOT LOGIN");
   }
})


app.post("/mobile/logout", uep, (req, res) => {
   var token = req.body.token;
   var login = wwt.getLoginFromToken(token);
   if (login === false) {
      res.end("false");
   } else {
      wwt.userLogout(token, login);
      fs.readFile(`userdata/${login}.json`, "utf-8", (err, data) => {
         var user = JSON.parse(data);
         chat.addnewmessage("exit", user);
      }, (err, resp, body) => {})
   }) res.send("true");
}
})



app.get("/mobile", (req, res) => {
   res.send("Это сообщение с сервера.");
})
