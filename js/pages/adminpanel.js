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
   var user = document.getElementById("inputLogin").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/make/admin", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      alert(xhr.responseText);
   }
   xhr.send(JSON.stringify({user : user}));
}

function makeUser() {
   var login = document.getElementById("adminselector").value;
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
