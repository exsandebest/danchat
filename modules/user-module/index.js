console.time("Module => user-module");
const md5 = require("md5");

const regLogin = /^[a-zA-Z0-9А-Яа-яЁё_@]{4,24}$/;
const regPassword = /^[a-zA-Z0-9А-Яа-яЁё_*@]{6,24}$/;
const regName = /^[a-zA-ZА-Яа-яЁё]{2,24}$/;
const regAge = /^[0-9]{1,3}$/;
const regSex = /[01]/;



exports.passwordValidate = (res, password, oldPassword, newPassword, repeatNewPassword) => {
   if (!oldPassword || !newPassword || !repeatNewPassword) {
      return new Verdict("Заполните все поля");
   }
   if (md5(oldPassword) !== password) {
      return new Verdict("Неверный старый пароль");
   }
   if (!regPassword.test(newPassword)) {
      return new Verdict("Некорректный пароль", "От 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_");
   }
   if (password === md5(newPassword)) {
      return new Verdict("Пароль не может быть изменен на старый");
   }
   if (newPassword !== repeatNewPassword) {
      return new Verdict("Новые пароли не совпадают");
   }
   return new Verdict("", "", true);
}



exports.nameValidate = (res, fn, ln) => { //fn - firstname; ln - lastname
   if (!fn || !ln) {
      return new Verdict("Заполните все поля");
   }
   if (!regName.test(fn)) {
      return new Verdict("Некорректное имя", "От 2-х до 24-х символов из русского или латинского алфавита");
   }
   if (!regName.test(ln)) {
      return new Verdict("Некорректная фамилия", "От 2-х до 24-х символов из русского или латинского алфавита");
   }
   return new Verdict("", "", true);
}



exports.registrationValidate = (req, res) => {
   var data = req.body;
   if (!data.age || !data.firstname || !data.lastname || !data.login || !data.sex || !data.password) {
      return new Verdict("Заполните все поля");
   }
   if (!regLogin.test(data.login)) {
      return new Verdict("Некорректный логин", "От 4-х до 24-х символов из русского, латинского алфавитов и цифр, а так же символы @_");
   }
   if (!regPassword.test(data.password)) {
      return new Verdict("Некорректный пароль", "От 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_")
   }
   if (!regName.test(data.firstname)) {
      return new Verdict("Некорректное имя", "От 2-х до 24-х символов из русского или латинского алфавита");
   }
   if (!regName.test(data.lastname)) {
      return new Verdict("Некорректная фамилия", "От 2-х до 24-х символов из русского или латинского алфавита");
   }
   if (!regAge.test(data.age)) {
      return new Verdict("Некорректный возраст", "Положительное число [1-217]");
   }
   if (!regSex.test(data.sex)) {
      return new Verdict("Некорректный пол", "Что-то пошло не так...");
   }
   return new Verdict("", "", true);
}

function Verdict(text1 = "", text2 = "", status = false) {
   this.text1 = text1;
   this.text2 = text2;
   this.status = status;
}


console.timeEnd("Module => user-module");