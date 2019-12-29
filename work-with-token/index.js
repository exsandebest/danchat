console.time("Module => work-with-token");
var logins = [];
var tokens = [];
const fs = require("fs");
const wwt = require("../work-with-token");
const chat = require("../chat");
const sql = require("../database");
const std = require("../standart");


exports.validate = (req, res)=>{
   var p = new Promise((resolve, reject)=>{
      var token = std.getCookie(req, "token");
      if (token) {
         sql.query(`select id from tokens where token = '${token}'`, (err, result)=>{
            if (err){
               console.error(err);
               reject("db");
            }
            if (result === undefined || result.length === 0){ // FIXME: ADD TIME UPDATE
               res.clearCookie("token");
               res.redirect("/login");
               resolve(false);
            } else {
               sql.query(`select login from users where id = ${result[0].id}`, (err, data)=>{
                  if (err) console.error(err);
                  let obj = {
                     id : result[0].id,
                     login : data[0].login
                  }
                  resolve(obj);
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


exports.validateAdmin = (req, res) => {
   var p = new Promise((resolve, reject)=>{
      var token = std.getCookie(req, "token");
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
               sql.query(`select login, admin from users where id = ${result[0].id}`, (err, data)=>{
                  if (err){
                     console.error(err);
                     reject("db");
                  }
                  if (result === undefined || result.length === 0){ // FIXME:  ADD TIME UPDATE
                     res.clearCookie("token");
                     res.redirect("/login");
                     resolve(false);
                  } else {
                     let obj = {
                        id : result[0].id,
                        login : data[0].login
                     }
                     resolve(obj);
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


console.timeEnd("Module => work-with-token");
