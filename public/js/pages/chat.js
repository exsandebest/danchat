'use strict';
const login = document.getElementById("prof").innerText;
const chat = document.getElementById("chat");
const symbolsCounter = document.getElementById("symbolsCounter");
const scroll = 1;
let minId = -1;
let isPending = 0;
let messagesElements = document.getElementsByClassName('msgText');
Array.from(messagesElements).forEach((element) => {
    element.removeEventListener('dblclick', deleteMessage);
    element.addEventListener('dblclick', deleteMessage);
});
sessionStorage.setItem("danchat.counter", "0");
getMsg(1);

chat.addEventListener('scroll', () => {
    if (minId === 1 || isPending) return;
    if (chat.scrollTop === 0) {
        getMsg();
    }
})

const audio = {};
const audioTypes = ["message", "registration"];
audioTypes.forEach((item) => {
    audio[item] = new Audio();
    audio[item].src = `/sounds/${item}.mp3`;
});

subscribe();

const socket = io();
socket.on("ADMINMESSAGE", serverData => {
    alert(serverData);
});

document.querySelector('textarea').addEventListener('keydown', function () {
    setTimeout(() => {
        this.style.cssText = `height:auto; padding: 3px`;
        this.style.cssText = `height: ${(this.scrollHeight + 3)}px`;
        if (this.value.length > 699) {
            symbolsCounter.innerText = `${(1000 - this.value.length)}/1000`;
            symbolsCounter.style.opacity = 1;
        } else {
            symbolsCounter.style.opacity = 0;
        }
    }, 0);
});


function sendMessage() {
    let elem = document.getElementById("message");
    let message = elem.value.trim();
    if (!message) return;
    fetch("/message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            message
        })
    }).then(res => {
        if (!res.ok) {
            errorChatPage(res.status);
        } else {
            res.json().then(data => {
                if (!data.status) {
                    errorChatPage(data.text || data);
                } else {
                    elem.value = "";
                    document.getElementById("symbolsCounter").style.opacity = 0;
                }
            }).catch(err => errorChatPage(err));
        }
    }).catch(err => errorChatPage(err));
}


function subscribe() {
    fetch("/subscribe").then(res => {
        if (!res.ok) {
            if (res.status === 503 || res.status === 324) {
                subscribe();
            } else {
                errorChatPage(res.status);
            }
        } else {
            res.json().then(m => {
                m.time = m.time.substring(0, m.time.length - 3);
                m.date = m.date.substring(0, m.date.length - 5);
                let templateStart = `<p class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a>`;
                let templateEnd = `</p><br>`;
                if (m.type === "message") {
                    let str = `${templateStart} <span class="messageTime">${m.date} ${m.time}</span><br><msg id = "msg${m.id}"></msg>${templateEnd}`;
                    complex(m, str);
                } else if (m.type === "registration") {
                    let str = `${templateStart} теперь в чате! <span class="messageTime">${m.date} ${m.time}</span>${templateEnd}`;
                    complex(m, str);
                }
            }).catch(err => errorChatPage(err));
        }
    }).catch(err => errorChatPage(err));
}

function complex(m, str) {
    chat.innerHTML += str;
    if (m.type === "message") document.getElementById(`msg${m.id}`).innerText = m.text;
    if (scroll) chat.scrollTop = chat.scrollHeight;
    messagesElements = document.getElementsByClassName('msgText');
    Array.from(messagesElements).forEach((element) => {
        element.removeEventListener('dblclick', deleteMessage);
        element.addEventListener('dblclick', deleteMessage);
    });
    subscribe();
    if (login !== m.login) audio[m.type].play();
}


function getMsg(scroll) {
    isPending = true;
    let prevHeight = chat.scrollHeight;
    chat.innerHTML = `<div id = "spinner"></div>` + chat.innerHTML;
    fetch("/get/message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            id: minId
        })
    }).then(res => {
        if (!res.ok) {
            errorChatPage(res.status);
        } else {
            res.json()
                .then(data => {
                    let elem = document.getElementById("spinner");
                    elem.parentNode.removeChild(elem);
                    parseMessages(data);
                    if (scroll) {
                        chat.scrollTop = chat.scrollHeight;
                    } else {
                        chat.scrollTop = chat.scrollHeight - prevHeight - 34;
                    }
                    isPending = false;
                })
                .catch(err => errorChatPage(err));
        }
    }).catch(err => errorChatPage(err));
}


function parseMessages(msgArr) {
    if (msgArr.length === 0) return;
    minId = msgArr[msgArr.length - 1].id;
    msgArr.forEach(m => {
        m.time = m.time.substring(0, m.time.length - 3);
        m.date = m.date.substring(0, m.date.length - 5);
        let templateStart = `<p class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a>`;
        let templateEnd = `</p><br>`;
        if (m.type === "message") {
            chat.innerHTML = `${templateStart} <span class="messageTime">${m.date} ${m.time}</span><br><msg id = "msg${m.id}"></msg>${templateEnd}` + chat.innerHTML;
            document.getElementById(`msg${m.id}`).innerText = m.text;
        } else if (m.type === "registration") {
            chat.innerHTML = `${templateStart} теперь в чате! <span class="messageTime">${m.date} ${m.time}</span>${templateEnd}` + chat.innerHTML;
        }
    })
    messagesElements = document.getElementsByClassName('msgText');
    Array.from(messagesElements).forEach((element) => {
        element.removeEventListener('dblclick', deleteMessage);
        element.addEventListener('dblclick', deleteMessage);
    });
}


function errorChatPage(text) {
    setTimeout(() => {
        VanillaToasts.create({
            title: "Ошибка",
            text,
            type: "error"
        });
    }, 2000);
}
