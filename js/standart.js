
if (sessionStorage.getItem("counter") === null){
  sessionStorage.setItem("counter", 0);
} else {
  if (Number(sessionStorage.getItem("counter")) != 0){
  if (Number(sessionStorage.getItem("counter"))> 99){
      document.getElementById("counter").innerHTML = "99+";
  } else {
      document.getElementById("counter").innerHTML = " "+sessionStorage.getItem("counter")+" ";
  }
}
}

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
    socket.on("CheckConnection", (data)=>{
      socket.emit("CheckConnectionAnswer", document.getElementById("prof").innerHTML);
    })


//Подписка на сообщение
function subscribe() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/subscribe", true);
  //Когда сообщение получено
  xhr.onload = ()=> {
    var r = JSON.parse(xhr.responseText);
    if (r.type === undefined){
      audio.message.play();
      updateCounter();
      subscribe();
    } else if (r.type === "enter"){
      audio.enter.play();
      updateCounter();
      subscribe();
    } else if (r.type === "exit"){
      audio.exit.play();
      updateCounter();
      subscribe();
    }
  }
  xhr.onerror = xhr.onabort = ()=> {
    if (xhr.status == 324) {
      setTimeout(subscribe, 0);
    } else {
      setTimeout(subscribe, 2000);
    }
  }
  xhr.send();
}



function updateCounter(){
  sessionStorage.setItem("counter", Number(sessionStorage.getItem("counter"))+1);
  var count = Number(sessionStorage.getItem("counter"));
  if (count != 0) {
      if (count> 99){
          document.getElementById("counter").innerHTML = "99+";
      } else {
          document.getElementById("counter").innerHTML = " "+count+" ";
      }
  }
}
