function sendMessage() {
   var message = document.getElementById("message").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/message", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      alert(xhr.responseText);
   }
   xhr.send(JSON.stringify({
      message : message
   }));

}

function makeAdmin() {
   var login = document.getElementById("inputLogin").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/make/admin", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      alert(xhr.responseText);
   }
   xhr.send(JSON.stringify({
      login : login
   }));
}

function makeUser() {
   var login = document.getElementById("inputLogin").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/make/user", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      alert(xhr.responseText);
   }
   xhr.send(JSON.stringify({
      login : login
   }));
}
