sessionStorage.clear();

function enter() {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/enter", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      if (xhr.responseText === "token") {
         location = "/";

      } else if (xhr.responseText.split(":")[0] === "false") {
         notif(xhr.responseText.split(":")[1]);
      } else {
         notif("Проблемы с сервером<br>Приносим извинения");
      }
   }
   xhr.send(`login=${document.getElementById("login").value.replace(/\s/,"")}&password=${document.getElementById("password").value.replace(/\s/,"")}`);
}

function notif(msg) {
   document.getElementById("notification").setAttribute("style", "opacity:0");
   document.getElementById("notification").innerHTML = `<notificationBad>${msg}</notificationBad>`;
   document.getElementById("notification").setAttribute("style", "opacity:1");
   setTimeout(() => {
      document.getElementById("notification").setAttribute("style", "opacity:0");
   }, 5000);

}
