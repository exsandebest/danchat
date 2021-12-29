'use strict';

function changePasword() {
    fetch("/user/change/password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            oldPassword: val("oldPassword"),
            newPassword: val("newPassword"),
            repeatNewPassword: val("repeatNewPassword")
        })
    }).then(res => {
        if (!res.ok) {
            error(res.status);
        } else {
            res.json().then(data => {
                if (data.status) {
                    notif(1, "Good", data.text, data.text2, 100000);
                    document.getElementById("oldPassword").innerHTML = "";
                    document.getElementById("newPassword").innerHTML = "";
                    document.getElementById("repeatNewPassword").innerHTML = "";
                } else {
                    notif(1, "Bad", data.text, data.text2, 10000);
                }
            }).catch(err => error(err));
        }
    }).catch(err => error(err));
}


function changeName() {
    fetch("/user/change/name", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            firstname: val("firstname"),
            lastname: val("lastname")
        })
    }).then(res => {
        if (!res.ok) {
            error(res.status);
        } else {
            res.json().then(data => {
                if (data.status) {
                    notif(2, "Good", data.text, data.text2, 10000);
                } else {
                    notif(2, "Bad", data.text, data.text2, 10000);
                }
            }).catch(err => error(err));
        }
    }).catch(err => error(err));
}

function notif(num, type, msg1, msg2, time) {
    let elem = document.getElementById(`notif${num === 1 ? "" : 2}`);
    elem.setAttribute("style", "opacity:0");
    elem.innerHTML = `<span class='notification${type}'>${msg1}</span><br><span class = 'orange'>${msg2}</span>`;
    elem.setAttribute("style", "opacity:1");
    setTimeout(() => {
        elem.setAttribute("style", "opacity:0");
    }, time);
}


function val(id) {
    return document.getElementById(id).value;
}
