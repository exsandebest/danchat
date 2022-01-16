'use strict';
console.time("Module => standard");
const CONSTANTS = require("./constants.js");

exports.getCookie = (req, name) => {
    try {
        let matches = req?.headers?.cookie?.match(new RegExp(
            "(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : false;
    } catch (e) {
        console.error(e);
        return false;
    }
}


exports.genToken = () => {
    let text = "";
    let possible = CONSTANTS.TOKEN_POSSIBLE_SYMBOLS;
    for (let i = 0; i < CONSTANTS.TOKEN_SYMBOLS_SIZE; ++i)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

console.timeEnd("Module => standard");
