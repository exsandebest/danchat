'use strict';
console.time("Module => constants");

// Token
exports.TOKEN_EXPIRATION_INTERVAL = "1 DAY"; // for SQL
exports.TOKEN_EXPIRATION_UPDATE_INTERVAL = 3600000; // ms, 1 hour
exports.TOKEN_SYMBOLS_SIZE = 30;
exports.TOKEN_POSSIBLE_SYMBOLS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890__";

// Default user settings
exports.DEFAULT_USER_COLOR = "#000000";

// Express
exports.DEFAULT_PORT = 5000;
exports.EXPRESS_STATIC_PUBLIC_TIME = "1h";

// Default admin account
exports.DEFAULT_ADMIN_LOGIN = "admin";
exports.DEFAULT_ADMIN_PASSWORD = "admin_1";
exports.DEFAULT_ADMIN_NAME = "Администратор";
exports.DEFAULT_ADMIN_AGE = 18;

// Cookie names
exports.COOKIE_NAME_TOKEN = "danchat.token";
exports.COOKIE_NAME_USER_COLOR = "danchat.user.color";

// user-module
exports.REGEXP_LOGIN = /^[a-zA-Z0-9А-яЁё_]{4,24}$/;
exports.REGEXP_PASSWORD = /^[a-zA-Z0-9А-яЁё_*@]{6,24}$/;
exports.REGEXP_NAME = /^[a-zA-ZА-яЁё]{1,24}$/;
exports.REGEXP_BIRTHDATE = /^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$/;
exports.REGEXP_SEX = /^[01]$/;
exports.REGEXP_COLOR = /^#[a-fA-F0-9]{3,8}$/;
exports.COLOR_COMPONENT_VALUE_LIMIT = 204;

// Other
exports.BCRYPT_SALT_ROUNDS = 3;
exports.MESSAGE_SYMBOLS_LIMIT = 1000;
exports.MESSAGES_BATCH_SIZE = 50;
exports.PROFILE_FRIENDS_DISPLAY_LIMIT = 6;
exports.ONLINE_USERS_UPDATE_INTERVAL = "5 MINUTE"; // for SQL

console.timeEnd("Module => constants");
