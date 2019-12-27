var login = document.getElementById("prof").innerText;
var minId = -1;

sessionStorage.setItem("counter", 0);



var audio = {};
audio.message = new Audio();
audio.message.src = "msg.mp3";
audio.enter = new Audio();
audio.enter.src = "enter.mp3";
audio.exit = new Audio();
audio.exit.src = "exit.mp3";

subscribe();

var socket = io();
socket.on("MESSAGE", function(serverData) {
   alert(serverData);
});

function sendMessage() {
   var msg = document.getElementById("message").value;
   if (msg){
      var xhr = new XMLHttpRequest();
      document.getElementById("message").value = "";
      xhr.open("POST", "/addnewmessage", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onerror = xhr.onabort = ()=>{
        alert("Ошибка при отправке сообщения");
      }
      xhr.send(JSON.stringify({
        message : msg
      }));
   }
}

function complex(r, str) {
   addToChat(str);
   if (r.type === "message") {
      document.getElementById(`msg${r.id}`).innerText = r.text;
   }
   subscribe();
   if (login != r.login) {
         audio[r.type].play();
   }
}

//Подписка на сообщение
function subscribe() {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", "/subscribe", true);
   //Когда сообщение получено
   xhr.onload = () => {
      var r = JSON.parse(xhr.responseText);
      if (r.type === "message") {
         var str = `<span class="msg" idx="${r.id}"><a class="login" href="/u/${r.login}"><strong style="color: ${r.color};">${r.login}</strong></a>:<msg id = "msg${r.id}"></msg><span class="messageTime">${r.time}</span></span><br>`;
         complex(r, str);
      } else if (r.type === "enter") {
         var str = `<span class="msg" idx="${r.id}"><a class="login" href="/u/${r.login}"><strong style="color: ${r.color};">${r.login}</strong></a><strong> вошел(ла) в чат</strong><span class="messageTime">${r.time}</span></span><br>`;
         complex(r, str);
      } else if (r.type === "exit") {
         var str = `<span class="msg" idx="${r.id}"><a class="login" href="/u/${r.login}"><strong style="color: ${r.color};">${r.login}</strong></a><strong> покинул(а) чат</strong><span class="messageTime">${r.time}</span></span><br>`;
         complex(r, str);
      }
   }
   //Когда долго нет ответа или ошибка сервера
   xhr.onerror = xhr.onabort = () => {
      if (xhr.status == 324) {
         setTimeout(subscribe, 0);
      } else {
         setTimeout(subscribe, 2000);
      }
   }
   xhr.send();
}




function getMsg() {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/get/message", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {

         parsMsg(JSON.parse(xhr.responseText));
      }
      xhr.onerror = xhr.onabort = ()=>{
        alert("Ошибка при получении сообщений");
      }
      xhr.send(JSON.stringify({
        id : minId
      }));
}


function parsMsg(msgObj) {
   if (msgObj.length === 0) return;
   var chat = document.getElementById("chat");
   minId = msgObj[msgObj.length-1].id;
   msgObj.forEach((m) => {
      if (m.type === "message") {
         chat.innerHTML = `<span class="msg" idx="${m.id}"><a class="login" href="/u/${m.login}"><strong style="color: ${m.color};">${m.login}</strong></a>: <msg id = "msg${m.id}"></msg><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
         document.getElementById(`msg${m.id}`).innerText = m.text;
      } else if (m.type === "enter") {
         chat.innerHTML = `<span class="msg" idx="${m.id}"><a class="login" href="/u/${m.login}"><strong style="color: ${m.color};">${m.login}</strong></a><strong> вошел(ла) в чат</strong><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
      } else if (m.type === "exit") {
         chat.innerHTML = `<span class="msg" idx="${m.id}"><a class="login" href="/u/${m.login}"><strong style="color: ${m.color};">${m.login}</strong></a><strong> покинул(а) в чат</strong><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
      }
   })
}


function addToChat(str) {
   document.getElementById("chat").innerHTML += str;
   if (document.getElementById("scroll").checked) {
      document.getElementById("chat").scrollTop = 99999999999999999999;
   }
}
