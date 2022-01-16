'use strict';
console.time("Module => user-module");
const CONSTANTS = require("./constants.js")


exports.passwordValidate = (oldPassword, newPassword, repeatNewPassword) => {
    if (!oldPassword || !newPassword || !repeatNewPassword) {
        return new Verdict("Заполните все поля");
    }
    if (!CONSTANTS.REGEXP_PASSWORD.test(newPassword)) {
        return new Verdict("Некорректный пароль", "От 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_");
    }
    if (newPassword !== repeatNewPassword) {
        return new Verdict("Новые пароли не совпадают");
    }
    return new Verdict("", "", true);
}


exports.nameValidate = (fn, ln) => { //fn - firstname; ln - lastname
    if (!fn || !ln) {
        return new Verdict("Заполните все поля");
    }
    if (!CONSTANTS.REGEXP_NAME.test(fn)) {
        return new Verdict("Некорректное имя", "От 2-х до 24-х символов из русского или латинского алфавита");
    }
    if (!CONSTANTS.REGEXP_NAME.test(ln)) {
        return new Verdict("Некорректная фамилия", "От 2-х до 24-х символов из русского или латинского алфавита");
    }
    return new Verdict("", "", true);
}


exports.registrationValidate = (body) => {
    let data = body;
    if (!data.birthdate || !data.firstname || !data.lastname || !data.login || !data.sex || !data.password) {
        return new Verdict("Заполните все поля");
    }
    if (!CONSTANTS.REGEXP_LOGIN.test(data.login)) {
        return new Verdict("Некорректный логин", "От 4-х до 24-х символов из русского, латинского алфавитов и цифр, а так же символы @_");
    }
    if (!CONSTANTS.REGEXP_PASSWORD.test(data.password)) {
        return new Verdict("Некорректный пароль", "От 6-ти до 24-х символов из русского, латинского алфавитов и цифр, а так же символы *@_")
    }
    if (!CONSTANTS.REGEXP_NAME.test(data.firstname)) {
        return new Verdict("Некорректное имя", "От 2-х до 24-х символов из русского или латинского алфавита");
    }
    if (!CONSTANTS.REGEXP_NAME.test(data.lastname)) {
        return new Verdict("Некорректная фамилия", "От 2-х до 24-х символов из русского или латинского алфавита");
    }
    if (!CONSTANTS.REGEXP_SEX.test(data.sex)) {
        return new Verdict("Некорректный пол", "Формат: male | female");
    }
    let v = data.birthdate.split(".");
    let dt = new Date(`${v[2]}/${v[1]}/${v[0]}`);
    if (!CONSTANTS.REGEXP_BIRTHDATE.test(data.birthdate) || dt.getDate() !== parseInt(v[0]) || dt.getMonth() + 1 !== parseInt(v[1]) || dt.getFullYear() !== parseInt(v[2])) {
        return new Verdict("Некорректная дата рождения", "Формат: ДД.ММ.ГГГГ");
    }
    return new Verdict("", "", true);
}


exports.validateSetting = (data) => {
    if (!CONSTANTS.REGEXP_COLOR.test(data.color)) {
        return new Verdict("Incorrect values: color");
    }
    let c = data.color;
    let v1 = parseInt(c[1] + c[2], 16),
        v2 = parseInt(c[3] + c[4], 16),
        v3 = parseInt(c[5] + c[6], 16);
    if (v1 > CONSTANTS.COLOR_COMPONENT_VALUE_LIMIT &&
        v2 > CONSTANTS.COLOR_COMPONENT_VALUE_LIMIT &&
        v3 > CONSTANTS.COLOR_COMPONENT_VALUE_LIMIT) {
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
