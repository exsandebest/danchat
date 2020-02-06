console.time("Module => user-module");
const md5 = require("md5");

const regLogin = /^[a-zA-Z0-9А-Яа-яЁё_@]{4,24}$/;
const regPassword = /^[a-zA-Z0-9А-Яа-яЁё_*@]{6,24}$/;
const regName = /^[a-zA-ZА-Яа-яЁё]{2,24}$/;
const regBirthdate = /^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$/;
const regSex = /[01]/;
const regColor = /^#[a-fA-F0-9]{3,8}$/;



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
   if (!data.birthdate || !data.firstname || !data.lastname || !data.login || !data.sex || !data.password) {
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
   if (!regSex.test(data.sex)) {
      return new Verdict("Некорректный пол", "Формат: male | female");
   }
   let v = data.birthdate.split(".");
   let dt = new Date(`${v[2]}/${v[1]}/${v[0]}`);
   if (!regBirthdate.test(data.birthdate) || dt.getDate() !== parseInt(v[0]) || dt.getMonth() + 1 !== parseInt(v[1]) || dt.getFullYear() !== parseInt(v[2])){
      return new Verdict("Некорректная дата рождения", "Формат: ДД.ММ.ГГГГ");
   }
   return new Verdict("", "", true);
}


exports.validateSetting = (data) => {
   if (!regColor.test(data.color)) {
      return new Verdict("Incorrect values: color");
   }
   if (data.scroll !== false && data.scroll !== true) {
      return new Verdict("Incorrect values: scroll");
   }
   let c = data.color;
   let v1 = parseInt(c[1] + c[2], 16),
      v2 = parseInt(c[3] + c[4], 16),
      v3 = parseInt(c[5] + c[6], 16);
   if (v1 > 204 && v2 > 204 && v3 > 204) {
      return new Verdict("Слишком светлый цвет<br>Пожалуйста, сделайте его темнее");
   }
   return new Verdict("", "", true);
}

function Verdict(text1 = "", text2 = "", status = false) {
   this.text1 = text1;
   this.text2 = text2;
   this.status = status;
}


console.timeEnd("Module => user-module");
