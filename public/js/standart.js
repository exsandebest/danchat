'use strict';
if (sessionStorage.getItem("danchat.counter") === null) {
    sessionStorage.setItem("danchat.counter", 0);
} else {
    let val = parseInt(sessionStorage.getItem("danchat.counter"));
    let elem = document.getElementById("counter");
    if (val != 0) {
        if (val > 99) {
            elem.innerText = "99+";
        } else {
            elem.innerText = ` ${val} `;
        }
    }
}

const audio = {};
const audioTypes = ["message", "registration"];
audioTypes.forEach((item) => {
    audio[item] = new Audio();
    audio[item].src = `/sounds/${item}.mp3`;
});

const socket = io();
socket.on("ADMINMESSAGE", serverData => {
    alert(serverData);
});

socket.on("chatMessage", msg => {
    audio[msg.type].play();
    updateCounter();
})


function updateCounter() {
    sessionStorage.setItem("danchat.counter", parseInt(sessionStorage.getItem("danchat.counter")) + 1);
    let count = parseInt(sessionStorage.getItem("danchat.counter"));
    let elem = document.getElementById("counter");
    if (count != 0) {
        if (count > 99) {
            elem.innerText = "99+";
        } else {
            elem.innerText = ` ${count} `;
        }
    }
}
