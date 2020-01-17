console.time("Module => user-module");
const fs = require('fs');
const md5 = require("md5");
const sql = require("../database");
const ResponseObject = require("../ResponseObject");

const regLogin = /^[a-zA-Z0-9А-Яа-яЁё_@]{4,24}$/;
const regPassword = /^[a-zA-Z0-9А-Яа-яЁё_*@]{6,24}$/;
const regName = /^[a-zA-ZА-Яа-яЁё]{2,24}$/;
const regAge = /^[0-9]{1,3}$/;
const regSex = /[01]/;



exports.passwordValidate = (res, password, oldPassword, newPassword, repeatNewPassword) => {
   if (oldPassword && newPassword && repeatNewPassword) {
      if (md5(oldPassword) === password) {
         if (regPassword.test(newPassword)) {
            if (newPassword === repeatNewPassword) {
               if (password !== md5(newPassword)) {
                  return true;
               } else {
                  badAns(res, "Пароль не может быть изменен на старый\n\n");
                  return false;
               }
            } else {
               badAns(res, "Новые пароли не совпадают\n\n");
               return false;
            }
         } else {
            badAns(res, "Некорректный пароль\n\nОт 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_");
            return false;
         }
      } else {
         badAns(res, "Неверный старый пароль\n\n");
         return false;
      }
   } else {
      badAns(res, "Заполните все поля\n\n");
      return false;
   }
}



exports.nameValidate = (res, fn, ln) => { //fn - firstname - Имя; ln - lastname - Фамилия
   if (fn && ln) {
      if (regName.test(fn)) {
         if (regName.test(ln)) {
            return true;
         } else {
            badAns(res, "Некорректная фамилия.\n\nОт 2-х до 24-х символов из русского или латинского алфавита");
            return false;
         }
      } else {
         badAns(res, "Некорректное имя.\n\nОт 2-х до 24-х символов из русского или латинского алфавита");
         return false;
      }
   } else {
      badAns(res, "Заполните все поля\n\n");
      return false;
   }
}



exports.registrationValidate = (req, res) => {
   var data = req.body;
   if (!data.age || !data.firstname || !data.lastname || !data.login || !data.sex || !data.password){
      return new Verdict("Заполните все поля");
   }
   if (!regLogin.test(data.login)){
      return new Verdict("Некорректный логин", "От 4-х до 24-х символов из русского, латинского алфавитов и цифр, а так же символы @_");
   }
   if (!regPassword.test(data.password)){
      return new Verdict("Некорректный пароль", "От 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_")
   }
   if (!regName.test(data.firstname)){
      return new Verdict("Некорректное имя","От 2-х до 24-х символов из русского или латинского алфавита");
   }
   if (!regName.test(data.lastname)){
      return new Verdict("Некорректная фамилия","От 2-х до 24-х символов из русского или латинского алфавита");
   }
   if (!regAge.test(data.age)){
      return new Verdict("Некорректный возраст","Положительное число [1-217]");
   }
   if (!regSex.test(data.sex)){
      return new Verdict("Некорректный пол","Что-то пошло не так...");
   }
   return new Verdict("","",true);
}



function badAns(res, msg) {
   res.json(new ResponseObject(false, msg));
}

function Verdict(text1 = "", text2 = "", status = false) {
   this.text1 = text1;
   this.text2 = text2;
   this.status = status;
}


console.timeEnd("Module => user-module");
