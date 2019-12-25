console.time("Module => work-with-token");
var logins = [];
var tokens = [];
const fs = require("fs");
const wwt = require("../work-with-token");
const chat = require("../chat");
const sql = require("../database");


exports.validate = (req, res)=>{
   var p = new Promise((resolve, reject)=>{
      var token = getCookie(req, "token");
      if (token) {
         sql.query(`select id from tokens where token = '${token}'`, (err, result)=>{
            if (err){
               console.error(err);
               reject("db");
            }
            if (result === undefined || result.length === 0){
               res.clearCookie("token");
               res.redirect("/login");
               resolve(false);
            } else {
               resolve(result[0].id);
            }
         })
      } else {
         res.clearCookie("token");
         res.redirect("/login");
         resolve(false);
      }
   });
   return p;
}


exports.validateAdmin = (req, res) => {
   var p = new Promise((resolve, reject)=>{
      var token = getCookie(req, "token");
      if (token) {
         sql.query(`select id from tokens where token = '${token}'`, (err, result)=>{
            if (err){
               console.error(err);
               reject("db");
            }
            if (result === undefined || result.length === 0){
               res.clearCookie("token");
               res.redirect("/login");
               resolve(false);
            } else {
               sql.query(`select admin from users where id = ${result[0].id}`, (err, data)=>{
                  if (err){
                     console.error(err);
                     reject("db");
                  }
                  if (result === undefined || result.length === 0){
                     res.clearCookie("token");
                     res.redirect("/login");
                     resolve(false);
                  } else {
                     resolve(result[0].id);
                  }
               })

            }
         })
      } else {
         res.clearCookie("token");
         res.redirect("/login");
         resolve(false);
      }
   });
   return p;
}

function getCookie(req, name) {
   try {
      var matches = req.headers.cookie.match(new RegExp(
         "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
      ));
      return matches ? decodeURIComponent(matches[1]) : false;
   } catch (e) {
      return false;
   }
}










console.timeEnd("Module => work-with-token");
