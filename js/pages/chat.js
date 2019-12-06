var login = document.getElementById("prof").innerText;
var maxId;
var minId;
function onload(){
var xhr = new XMLHttpRequest();
xhr.open("GET","/get/GUID",true);
xhr.onload = ()=>{
  maxId = Number(xhr.responseText);
  getMsg(true);
}
xhr.onabort = xhr.onerror =()=>{
  console.error("Проблемы!");
  onload();
}
xhr.send();
}

sessionStorage.setItem("counter", 0);



var audio = {};
audio.message = new Audio();
audio.message.src = "msg.mp3";
audio.enter = new Audio();
audio.enter.src = "enter.mp3";
audio.exit = new Audio();
audio.exit.src = "exit.mp3";

subscribe();
usersOnline(false);

var socket = io();
    socket.on("MESSAGE", function(serverData) {
       alert(serverData);
    });
socket.on("CheckConnection", (data)=>{
  socket.emit("CheckConnectionAnswer", login);
})

function sendMessage() {
    var msg = document.getElementById("message").value;
    if (msg == false) {
  ////////////////////////////
    } else {
        var xhr = new XMLHttpRequest();
        document.getElementById("message").value = "";
        xhr.open("POST", "/addnewmessage", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send("message=" + msg);
    }
}

function complex(r,str,ou){
  maxid = r.id;
  addToChat(str);
  if (!ou){
      document.getElementById(`msg${r.id}`).innerText = r.text;
  }
  subscribe();
  if (login != r.from){
    if (r.type){
      audio[r.type].play();
    } else {
      audio["message"].play();
    }
  }
  if (ou) {
  usersOnline(false);
  }
}

//Подписка на сообщение
function subscribe() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/subscribe", true);
    //Когда сообщение получено
    xhr.onload = ()=> {
        var r = JSON.parse(xhr.responseText);
        if (r.type === undefined){
          var str =  `<span class="msg" idx="${r.id}"><a class="login" href="/user?${r.from}"><strong style="color: ${r.color};">${r.from}</strong></a>:<msg id = "msg${r.id}"></msg><span class="messageTime">${r.time}</span></span><br>`;
          complex(r,str, false);
        } else if (r.type === "enter"){
            var str =  `<span class="msg" idx="${r.id}"><a class="login" href="/user?${r.from}"><strong style="color: ${r.color};">${r.from}</strong></a><strong> вошел(ла) в чат</strong><span class="messageTime">${r.time}</span></span><br>`;
            complex(r,str,true);
        } else if (r.type === "exit"){
            var str =  `<span class="msg" idx="${r.id}"><a class="login" href="/user?${r.from}"><strong style="color: ${r.color};">${r.from}</strong></a><strong> покинул(а) чат</strong><span class="messageTime">${r.time}</span></span><br>`;
            complex(r,str,true);
        }
    }
    //Когда долго нет ответа или ошибка сервера
    xhr.onerror = xhr.onabort = ()=> {
        if (xhr.status == 324) {
            setTimeout(subscribe, 0);
        } else {
            setTimeout(subscribe, 2000);
        }
    }
    xhr.send();
}




function getMsg (start){
if (start){
  var xhr = new XMLHttpRequest();
  xhr.open("POST","/get/message",true);
  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  xhr.onload = ()=>{
    parsMsg(xhr.responseText);
    if (document.getElementById("scroll").checked == true) {
        document.getElementById("chat").scrollTop = 99999999999999999999;
    }
  }
  xhr.send(`id=${maxId}`);
} else {
  var xhr = new XMLHttpRequest();
  xhr.open("POST","/get/message",true);
  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
  xhr.onload = ()=>{
    parsMsg(xhr.responseText);
  }
  xhr.send(`id=${minId}`);
}
}


function parsMsg(txtMsg) {
var msgObj = JSON.parse(txtMsg);
var chat = document.getElementById("chat");
minId = msgObj.minId;
msgObj.msg.forEach((m)=>{
  if (m.type === undefined){
  chat.innerHTML =  `<span class="msg" idx="${m.id}"><a class="login" href="/user?${m.from}"><strong style="color: ${m.color};">${m.from}</strong></a>: <msg id = "msg${m.id}"></msg><span class="messageTime">${m.time}</span></span><br>`+chat.innerHTML;
  document.getElementById(`msg${m.id}`).innerText = m.text;
} else if (m.type === "enter"){
  chat.innerHTML = `<span class="msg" idx="${m.id}"><a class="login" href="/user?${m.from}"><strong style="color: ${m.color};">${m.from}</strong></a><strong> вошел(ла) в чат</strong><span class="messageTime">${m.time}</span></span><br>` + chat.innerHTML;
} else if (m.type === "exit"){
  chat.innerHTML = `<span class="msg" idx="${m.id}"><a class="login" href="/user?${m.from}"><strong style="color: ${m.color};">${m.from}</strong></a><strong> покинул(а) в чат</strong><span class="messageTime">${m.time}</span></span><br>`   + chat.innerHTML;
}
})
}



function usersOnline(bool){
  var xhr = new XMLHttpRequest();
  xhr.open("GET","/onlineCounter", true);
  xhr.onload = ()=>{
      document.getElementById("onlineCounter").innerHTML = JSON.parse(xhr.responseText).length;
      document.getElementById("onlineCounterCover").title = JSON.parse(xhr.responseText);
      if (bool) {
      var str = `<br><center><div style="border: 4px outset red; width:25%; "><strong>Онлайн:</strong><br>`+JSON.parse(xhr.responseText).join("<br>")+"</div><br></center>";
      addToChat(str);
    }
  }
  xhr.send();
}

function addToChat(str) {
    document.getElementById("chat").innerHTML += str ;
    if (document.getElementById("scroll").checked == true) {
        document.getElementById("chat").scrollTop = 99999999999999999999;
    }
}
