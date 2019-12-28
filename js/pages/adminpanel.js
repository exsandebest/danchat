var gxhr = new XMLHttpRequest();
gxhr.open("GET", "/admin/toMakeAdmin/list", true);
gxhr.onload = () => {
   var users = JSON.parse(gxhr.responseText);
   users.forEach((user) => {
      var option = document.createElement("option");
      option.value = user;
      option.innerHTML = user;
      document.getElementById("userselector").appendChild(option);
   })
}
gxhr.send();




var gxhr2 = new XMLHttpRequest();
gxhr2.open("GET", "/admin/toMakeUser/list", true);
gxhr2.onload = () => {
   var admins = JSON.parse(gxhr2.responseText);
   admins.forEach((admin) => {
      if (admin === "") {
         admins.splice(admins.indexOf(admin), 1);
      } else {
         var option = document.createElement("option");
         option.value = admin;
         option.innerHTML = admin;
         document.getElementById("adminselector").appendChild(option);
      }
   })
}
gxhr2.send();


function sendMessage() {
   var message = document.getElementById("message").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/message", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      alert(xhr.responseText);
   }
   xhr.send(JSON.stringify({
      message : message
   }));

}



function makeAdmin() {
   var user = document.getElementById("userselector").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/make/admin", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      alert(xhr.responseText);
      location.reload();
   }
   xhr.send("user=" + user);
}

function makeUser() {
   var login = document.getElementById("adminselector").value;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/admin/make/user", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      alert(xhr.responseText);
      location.reload();
   }
   xhr.send("login=" + login);
}
