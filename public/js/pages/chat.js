var login = document.getElementById("prof").innerText;
var chat = document.getElementById("chat");
var minId = -1;
var isPending = 0;
sessionStorage.setItem("counter", 0);
getMsg(1);
chat.addEventListener('scroll', ()=>{
   if (minId === 1 || isPending) return;
   if (chat.scrollTop === 0){
      getMsg();
   }
})

var audio = {};
var audioTypes = ["message", "registration"];
audioTypes.forEach((item) => {
   audio[item] = new Audio();
   audio[item].src = `/sounds/${item}.mp3`;
});

subscribe();

var socket = io();
socket.on("ADMINMESSAGE", serverData => {
   alert(serverData);
});


function sendMessage() {
   let elem = document.getElementById("message");
   let message = elem.value;
   if (message.length > 500){
      VanillaToasts.create({
         type : "warning",
         title : "Ограничение",
         text : "Длина сообщения не должна превышать 500 символов",
         timeout : 10000
      })
      return;
   }
   if (!message) return;
   fetch("/addnewmessage", {
      method: "POST",
      headers: {
         "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify({
         message
      })
   }).then(res => {
      if (!res.ok) {
         errorChatPage(res.status, "sm");
      } else {
         res.json().then(data => {
            if (!data.status) {
               errorChatPage(data.text || data, "sm");
            } else {
               elem.value = "";
            }
         }).catch(err => errorChatPage(err, "sm"));
      }
   }).catch(err => errorChatPage(err, "sm"));
}


function subscribe() {
   fetch("/subscribe").then(res => {
      if (!res.ok) {
         if (res.status === 503 || res.status === 324) {
            subscribe();
         } else {
            errorChatPage(res.status, "gm");
         }
      } else {
         res.json().then(m => {
            let templateStart = `<span class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a>`;
            let templateEnd = `<span class="messageTime">${m.time}</span></span><br>`;
            if (m.type === "message") {
               let str = `${templateStart}: <msg id = "msg${m.id}"></msg>${templateEnd}`;
               complex(m, str);
            } else if (m.type === "registration") {
               let str = `${templateStart} теперь в чате!${templateEnd}`;
               complex(m, str);
            }
         }).catch(err => errorChatPage(err, "gm"));
      }
   }).catch(err => errorChatPage(err, "gm"));
}

function complex(m, str) {
   addToChat(str, m.scroll);
   if (m.type === "message") {
      document.getElementById(`msg${m.id}`).innerText = m.text;
   }
   subscribe();
   if (login != m.login) {
      audio[m.type].play();
   }
}



function getMsg(scroll) {
   isPending = true;
   let prevHeight = chat.scrollHeight;
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
         errorChatPage(res.status, "gm");
      } else {
         res.json()
            .then(data => {
               parseMessages(data);
               if (scroll) {
                  chat.scrollTop = chat.scrollHeight;
               } else {
                  chat.scrollTop = chat.scrollHeight - prevHeight;
               }
               isPending = false;
            })
            .catch(err => errorChatPage(err, "gm"));
      }
   }).catch(err => errorChatPage(err, "gm"));
}


function parseMessages(msgArr) {
   if (msgArr.length === 0) return;
   minId = msgArr[msgArr.length - 1].id;
   msgArr.forEach(m => {
      let templateStart = `<span class="msgText" idx="${m.id}"><a class="login" href="/u/${m.login}"><b style="color: ${m.color};">${m.login}</b></a>`;
      let templateEnd = `<span class="messageTime">${m.time}</span></span><br>`;
      if (m.type === "message") {
         chat.innerHTML = `${templateStart}: <msg id = "msg${m.id}"></msg>${templateEnd}` + chat.innerHTML;
         document.getElementById(`msg${m.id}`).innerText = m.text;
      } else if (m.type === "registration") {
         chat.innerHTML = `${templateStart} теперь в чате!${templateEnd}` + chat.innerHTML;
      }
   })
}


function addToChat(str, scroll) {
   chat.innerHTML += str;
   if (scroll) {
      chat.scrollTop = chat.scrollHeight;
   }
}


function errorChatPage(text, type = "e") { // sm - sendMessage, gm - getMessage, e - standart error
   let prevText = type === "e" ? "Ошибка: " : (type === "sm" ? "Ошибка при отправке сообщения: " : "Ошибка при получении сообщений: ");
   VanillaToasts.create({
      title: "Ошибка",
      text: prevText + text,
      type: "error"
   });
}
