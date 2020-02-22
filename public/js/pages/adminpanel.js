'use strict';
function sendMessage() {
    fetch("/admin/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify({
                message: document.getElementById("message").value
            })
        })
        .then(res => res.json())
        .then(data => alert(data.status))
        .catch(err => alert(err));
}

function makeAdmin() {
    fetch("/admin/make/admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify({
                login: document.getElementById("inputLogin").value
            })
        })
        .then(res => res.json())
        .then(data => alert(data.status))
        .catch(err => alert(err));
}

function makeUser() {
    fetch("/admin/make/user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify({
                login: document.getElementById("inputLogin").value
            })
        })
        .then(res => res.json())
        .then(data => alert(data.status))
        .catch(err => alert(err));
}
