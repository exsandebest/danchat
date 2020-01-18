if (sessionStorage.getItem("counter") === null) {
   sessionStorage.setItem("counter", 0);
} else {
   if (Number(sessionStorage.getItem("counter")) != 0) {
      if (Number(sessionStorage.getItem("counter")) > 99) {
         document.getElementById("counter").innerHTML = "99+";
      } else {
         document.getElementById("counter").innerHTML = " " + sessionStorage.getItem("counter") + " ";
      }
   }
}

var audio = {};
var audioTypes = ["message", "enter", "exit"];
audioTypes.forEach((item) => {
   audio[item] = new Audio();
   audio[item].src = `/sounds/${item}.mp3`;
});

var socket = io();
socket.on("ADMINMESSAGE", function(serverData) {
   alert(serverData);
});

socket.on("chatMessage", (msg) => {
   audio[msg.type].play();
   updateCounter();
})


function updateCounter() {
   sessionStorage.setItem("counter", Number(sessionStorage.getItem("counter")) + 1);
   var count = Number(sessionStorage.getItem("counter"));
   if (count != 0) {
      if (count > 99) {
         document.getElementById("counter").innerHTML = "99+";
      } else {
         document.getElementById("counter").innerHTML = " " + count + " ";
      }
   }
}
