'use strict';
console.time("Module => Queries");
const sql = require("mysql2");

exports.getOnlineUsersCountQuery = () => {
    return `
        select count(*) as onlineCounter
        from tokens
                 left join users
                           on tokens.user_id = users.id
        where tokens.time >= (NOW() - INTERVAL 5 MINUTE)`;
}

exports.getAuthorizeUserQuery = (login) => {
    return `
        select id,
               login,
               password,
               color
        from users
        where login = ${sql.escape(login)}`;
}

exports.getUserProfileQuery = (id) => {
    return `
        select login,
               admin      as isAdmin,
               color,
               firstname,
               lastname,
               img_status as imgStatus
        from users
        where id = ${sql.escape(id)}`;
}

exports.getPeopleQuery = () => {
    return `
        select login,
               firstname,
               lastname,
               color,
               img_status as imgStatus
        from users`;
}

exports.getSettingsQuery = (id) => {
    return `
        select color
        from users
        where id = ${sql.escape(id)}`;
}

exports.getDeleteTokenQuery = (id) => {
    return `
        delete
        from tokens
        where user_id = ${sql.escape(id)}`;
}

exports.getSetTokenQuery = (id, token) => {
    return `
        insert
        into tokens (user_id,
                     token,
                     time)
        values (${sql.escape(id)},
                ${sql.escape(token)},
                NOW())`;
}

exports.getMessagesIntervalQuery = (idStart, idEnd) => {
    return `
        select login,
               color,
               id,
               type,
               text,
               DATE_FORMAT(time, '%H:%i:%S') as time,
               DATE_FORMAT(time, '%d.%m.%Y') as date
        from chat
        where id between ${sql.escape(idStart)} and ${sql.escape(idEnd)}
        order by id desc`;
}

exports.getLastMessagesQuery = (portion) => {
    return `
        select login,
               color,
               id,
               type,
               text,
               DATE_FORMAT(time, '%H:%i:%S') as time,
               DATE_FORMAT(time, '%d.%m.%Y') as date
        from chat
        order by id desc
        limit ${sql.escape(portion)}`;
}

exports.getChangePermissionsQuery = (login, isAdmin) => {
    return `
        update users
        set admin = ${sql.escape(isAdmin)}
        where login = ${sql.escape(login)}`;
}

exports.getChangeNameQuery = (id, firstname, lastname) => {
    return `
        update users
        set firstname = ${sql.escape(firstname)},
            lastname  = ${sql.escape(lastname)}
        where id = ${sql.escape(id)}`;
}

exports.getChangeSettingsQuery = (id, color) => {
    return `
        update users
        set color = ${sql.escape(color)}
        where id = ${sql.escape(id)}`;
}

exports.getCheckSpammingByTimingQuery = () => {
    // TODO: Check spamming
}

exports.getUserColorQuery = (id) => {
    return `
        select color
        from users
        where id = ${sql.escape(id)}`;
}

exports.getRegisterUserQuery = (user) => {
    return `
        insert into users (login, password, birthdate, sex, firstname, lastname)
        values (${sql.escape(user.login)},
                ${sql.escape(user.password)},
                ${sql.escape(user.birthdate)},
                ${sql.escape(user.sex)},
                ${sql.escape(user.firstname)}, 
                ${sql.escape(user.lastname)})`;
}

exports.getCheckLoginQuery = (login) => {
    return `
        select login
        from users
        where login = ${sql.escape(login)}`
}

exports.getFriendsRequestsCountQuery = (id) => {
    return `
        select COUNT(id_from) as reqs
        from friends_requests
        where id_to = ${sql.escape(id)}
        union all
        select COUNT(id_to)
        from friends_requests
        where id_from = ${sql.escape(id)}`
}

exports.getFriendsQuery = (id, limit) => {
    return `
        select login, 
               color, 
               img_status as imgStatus, 
               firstname, 
               lastname
        from users
        where id in
            (select id_2
             from friends
             where id_1 = ${sql.escape(id)})
        limit ${sql.escape(limit)}`;
}

exports.getIncomingRequestsQuery = (id) => {
    return `
        select login, 
               color, 
               img_status as imgStatus,
               firstname, 
               lastname
        from users
        where id in 
            (select id_from 
             from friends_requests 
             where id_to = ${sql.escape(id)})`;
}

exports.getOutcomingRequestsQuery = (id) => {
    return `
        select login, 
               color, 
               img_status as imgStatus,
               firstname, 
               lastname
        from users
        where id in 
            (select id_to 
             from friends_requests 
             where id_from = ${sql.escape(id)})`;
}

exports.getCheckIsUserOnlineQuery = (id) => {
    return `
        select if (count(*) > 0, 'online', 'offline') as status
        from tokens
        where time >= (NOW() - INTERVAL 5 MINUTE)
        and user_id = ${sql.escape(id)}`;
}

exports.getCheckFriendshipQuery = (id1, id2) => {
    return `
        select (count(*) > 0) as rowFound
        from friends
        where (id_1 = ${sql.escape(id1)} 
              and id_2 = ${sql.escape(id2)})`;
}

exports.getCheckIncomingRequestStatusQuery = (id1, id2) => {
    return `
        select (count(*) > 0) as rowFound
        from friends_requests
        where id_from = ${sql.escape(id2)}
              and id_to = ${sql.escape(id1)}`;
}

exports.getCheckOutcomintRequestStatusQuery = (id1, id2) => {
    return `
        select (count(*) > 0) as rowFound
        from friends_requests
        where id_from = ${sql.escape(id1)}
              and id_to = ${sql.escape(id2)}`;
}

exports.getUserQuery = (login) => {
    console.log(sql.escape(login));
    return `
        select id,
               login,
               firstname,
               lastname,
               color,
               DATE_FORMAT(birthdate, '%d.%m.%Y') as birthdate,
               (DATE_FORMAT(FROM_DAYS(TO_DAYS(now()) - TO_DAYS(birthdate)), '%Y') + 0) as age,
               if (sex, 'Мужской', 'Женский') as sex,
               img_status as imgStatus
        from users
        where login = ${sql.escape(login)}`;
}

exports.getUserPasswordQuery = (id) => {
    return `
        select password
        from users
        where id = ${sql.escape(id)}`;
}

exports.getUpdateUserPasswordQuery = (id, password) => {
    return `
        update users
        set password = ${sql.escape(password)}
        where id = ${sql.escape(id)}`;
}

exports.getUserByTokenQuery = (token) => {
    return `
        select user_id as id,
               login,
               admin as isAdmin
        from tokens
        left join users u 
        on tokens.user_id = u.id
        where token = ${sql.escape(token)}`;
}

exports.getUpdateTokenTimeQuery = (token) => {
    return `
        update tokens
        set time = NOW()
        where token = ${sql.escape(token)}`;
}

exports.getAddMessageQuery = (msg) => {
    return `
    insert 
    into chat (text, 
               user_id, 
               login, 
               color,
               type, 
               time)
    values (${sql.escape(msg.text)}, 
            ${sql.escape(msg.user_id)}, 
            ${sql.escape(msg.login)}, 
            ${sql.escape(msg.color)}, 
            ${sql.escape(msg.type)}, 
            NOW())`
}

exports.getUserIdByLoginQuery = (login) => {
    return `
        select id,
               login
        from users
        where login = ${sql.escape(login)}`;
}

exports.getDeleteIncomingRequestRowQuery = (id_from, id_to) => {
    return `
        delete
        from friends_requests
        where id_from = ${sql.escape(id_from)}
          and id_to = ${sql.escape(id_to)}`;
}

exports.getAddFriendshipRowQuery = (id1, id2) => {
    return `
        insert 
        into friends (id_1, 
                      id_2)
        values (${sql.escape(id1)}, ${sql.escape(id2)}),
               (${sql.escape(id2)}, ${sql.escape(id1)})`;
}

exports.getTokenByUserIdQuery = (id) => {
    return `
        select token
        from tokens
        where user_id = ${sql.escape(id)}`;
}

exports.getDeleteFriendshipRowQuery = (id1, id2) => {
    return `
        delete
        from friends
        where (id_1 = ${sql.escape(id1)} and id_2 = ${sql.escape(id2)})
              or (id_2 = ${sql.escape(id1)} and id_1 = ${sql.escape(id2)})`;
}

exports.getAddFriendsRequestRowQuery = (id_from, id_to) => {
    return `
        insert 
        into friends_requests (id_from, id_to)
        values (${sql.escape(id_from)}, ${sql.escape(id_to)})`;
}

exports.getCancelOutcomingRequestQuery = (id_from, id_to) => {
    return `
        delete
        from friends_requests
        where id_from = ${sql.escape(id_from)}
        and id_to = ${sql.escape(id_to)}`;
}

exports.getDeleteMessageQuery = (id) => {
    return `
        delete
        from chat
        where id = ${sql.escape(id)}`;
}

console.timeEnd("Module => Queries");
