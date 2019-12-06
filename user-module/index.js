console.time("Module => user-module");
const fs = require('fs');
const md5 = require("md5");
const crypt = require('../crypt');
var logins = [];

const regLogin = /^[a-zA-Z0-9А-Яа-яЁё_@]{4,24}$/;
const regPassword = /^[a-zA-Z0-9А-Яа-яЁё_*@]{6,24}$/;
const regName = /^[a-zA-ZА-Яа-яЁё]{2,24}$/;
const regAge = /^[0-9]{1,3}$/;
const regSex1 = /male/;
const regSex2 = /female/;

update();

fs.watch("data/userlist.json", (event, filename)=>{
  update();
});



function update(){
fs.readFile("data/userlist.json", "utf-8", (err, data)=>{
  logins = JSON.parse(data);
});
}




exports.passwordValidate = (res, password, oldPassword, newPassword, repeatNewPassword)=>{
  if (oldPassword && newPassword && repeatNewPassword){
  if (md5(oldPassword) === password){
    if (regPassword.test(newPassword)){
      if (newPassword === repeatNewPassword){
        if (password !== md5(newPassword)){
          return true;
        } else {
          badAns(res,"Пароль не может быть изменен на старый\n\n");
          return false;
        }
      } else {
        badAns(res,"Новые пароли не совпадают\n\n");
        return false;
      }
    } else {
      badAns(res,"Некорректный пароль\n\nОт 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_");
      return false;
    }
  } else{
    badAns(res,"Неверный старый пароль\n\n");
    return false;
  }
} else {
  badAns(res, "Заполните все поля\n\n");
  return false;
}
}

exports.nameValidate = (res, fn, ln) =>{ //fn - firstname - Имя; ln - lastname - Фамилия
  if (fn && ln) {
    if (regName.test(fn)){
      if (regName.test(ln)){
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


exports.registrationValidate = (req, res)=>{
    var data = req.body;
    if (data.age && data.firstname && data.lastname && data.login && data.sex && data.password) {
    if (logins.indexOf(data.login) == -1){
    if (data.submit === "REAL"){
    if (regLogin.test(data.login)){
    if (regPassword.test(data.password)){
        if (regName.test(data.firstname) && data.firstname !== undefined){
            if (regName.test(data.lastname) && data.lastname !== undefined){
                if (regAge.test(data.age) && data.age>0 && data.age<218){
                    if (regSex1.test(data.sex) || regSex2.test(data.sex)){
                        return true;
                    } else {
                        badAns(res, "Некорректный пол.\n\nХз как так вообще получилось");
                        return false;
                    }
                } else {
                    badAns(res, "Некорректный возраст.\n\nПоложительное число [1-217]");
                    return false;
                }
            } else {
                badAns(res, "Некорректная фамилия.\n\nОт 2-х до 24-х символов из русского или латинского алфавита");
                return false;
            }
        } else {
            badAns(res,"Некорректное имя.\n\nОт 2-х до 24-х символов из русского или латинского алфавита" );
            return false;
        }
    } else {
        badAns(res,"Некорректный пароль.\n\nОт 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_");
        return false;
    }
    } else {
        badAns(res,"Некорректный логин.\n\nОт 4-х до 24-х символов из русского, латинского алфавитов и цифр, а так же символы @_");
        return false;
    }
    } else {
        badAns(res, "Запрос может быть отправлен только со страницы регистрации.\n\n");
        return false;
    }
  } else {
    badAns(res, "Данный логин уже занят\n\n");
    return false;
  }
} else {
  badAns(res, "Заполните все поля\n\n");
  return false;
}
}

function badAns(res,msg) {
    res.send("false:"+msg);
}




console.timeEnd("Module => user-module");
