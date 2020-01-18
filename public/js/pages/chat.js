var login = document.getElementById("prof").innerText;
var chat = document.getElementById("chat");
var minId = -1;

sessionStorage.setItem("counter", 0);
getMsg(1);




var audio = {};
var audioTypes = ["message", "enter", "exit"];
audioTypes.forEach((item) => {
   audio[item] = new Audio();
   audio[item].src = `/sounds/${item}.mp3`;
});

subscribe();

var socket = io();
socket.on("ADMINMESSAGE", function(serverData) {
   alert(serverData);
});

function sendMessage() {
   var msg = document.getElementById("message").value;
   if (msg){
      var xhr = new XMLHttpRequest();
      document.getElementById("message").value = "";
      xhr.open("POST", "/addnewmessage", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () =>{
         if (xhr.status === 200){
            if (!JSON.parse(xhr.responseText).status){
               alert("Ошибка при отправке сообщения");
            }
         } else {
            alert("Ошибка при отправке сообщения");
         }
      }
      xhr.onerror = xhr.onabort = ()=>{
        alert("Ошибка при отправке сообщения");
      }
      xhr.send(JSON.stringify({
        message : msg
      }));
   }
}

function complex(r, str) {
   addToChat(str, r.scroll);
   if (r.type === "message") {
      document.getElementById(`msg${r.id}`).innerText = r.text;
   }
   subscribe();
   if (login != r.login) {
         audio[r.type].play();
   }
}

function subscribe() {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", "/subscribe", true);
   xhr.onload = () => {
      var r = JSON.parse(xhr.responseText);
      if (r.type === "message") {
         var str = `<span class="msgText" idx="${r.id}"><a class="login" href="/u/${r.login}"><b style="color: ${r.color};">${r.login}</b></a>: <msg id = "msg${r.id}"></msg><span class="messageTime">${r.time}</span></span><br>`;
         complex(r, str);
      } else if (r.type === "enter") {
         var str = `<span class="msgText" idx="${r.id}"><a class="login" href="/u/${r.login}"><b style="color: ${r.color};">${r.login}</b></a><b> вошел(ла) в чат</b><span class="messageTime">${r.time}</span></span><br>`;
         complex(r, str);
      } else if (r.type === "exit") {
         var str = `<span class="msgText" idx="${r.id}"><a class="login" href="/u/${r.login}"><b style="color: ${r.color};">${r.login}</b></a><b> покинул(а) чат</b><span class="messageTime">${r.time}</span></span><br>`;
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




function getMsg(scroll) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/get/message", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
         parsMsg(JSON.parse(xhr.responseText));
         if (scroll){
            chat.scrollTop = chat.scrollHeight;
         } else {
            chat.scrollTop = 0;
         }
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
   minId = msgObj[msgObj.length-1].id;
   msgObj.forEach((m) => {
      if (m.type === "message") {
         chat.innerHTML = `<span class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a>: <msg id = "msg${m.id}"></msg><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
         document.getElementById(`msg${m.id}`).innerText = m.text;
      } else if (m.type === "enter") {
         chat.innerHTML = `<span class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a><b> вошел(ла) в чат</b><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
      } else if (m.type === "exit") {
         chat.innerHTML = `<span class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a><b> покинул(а) в чат</b><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
      }
   })
}


function addToChat(str, scroll) {
   chat.innerHTML += str;
   if (scroll) {
      chat.scrollTop = chat.scrollHeight;
   }
}
