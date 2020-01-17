sessionStorage.clear();

function enter() {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/login", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.status == 200){
         var obj = JSON.parse(xhr.responseText);
         if (obj.status){
            location = "/";
         } else {
            notif(obj.text);
         }
      } else {
         notif("Проблемы с сервером<br>Приносим извинения");
      }
   }
   xhr.onerror = xhr.onabort = () => {
      notif("Проблемы с сервером<br>Приносим извинения")
   }
   xhr.send(JSON.stringify({
      login : document.getElementById("login").value.replace(/\s/,""),
      password : document.getElementById("password").value.replace(/\s/,"")
   }))
}

function notif(msg) {
   var elem = document.getElementById("notification");
   elem.setAttribute("style", "opacity:0");
   elem.innerHTML = `<span class='notificationBad'>${msg}</span>`;
   elem.setAttribute("style", "opacity:1");
   setTimeout(() => {
      elem.setAttribute("style", "opacity:0");
   }, 5000);

}
