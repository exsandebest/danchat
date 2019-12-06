var gxhr = new XMLHttpRequest();
gxhr.open("GET", "/users/toMakeAdmin/list", true);
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
gxhr2.open("GET", "/users/toMakeUser/list", true);
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
  xhr.send("message=" + message);

}


function getLogin() {
  var token = document.getElementById("token").value;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/admin/get/login", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = ()=>{
    alert(xhr.responseText);
  }
  xhr.send("token=" + token);

}

function getToken() {
  var login = document.getElementById("login").value;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/admin/get/token", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload= ()=>{
      alert(xhr.responseText);
  }
  xhr.send("login=" + login);

}


function createCouple() {
  var login = document.getElementById("loginforcreate").value;
  var token = document.getElementById("tokenforcreate").value;
  if (login == false || token == false) {
    document.getElementById("notif4").innerHTML = "Тупой админ :|";
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/set/couple", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onload = ()=>{
      alert(xhr.responseText);
    }
    xhr.send("login=" + login + "&token=" + token);
    document.getElementById("notif4").innerHTML = "";
  }
}


function deleteCouple() {
  var login = document.getElementById("loginfordelete").value;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/admin/delete/couple", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = ()=> {
    alert(xhr.responseText);
  }
  xhr.send("login=" + login);

}


function validate() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/admin/validate/me", true);
  xhr.onload = () => {
    alert(xhr.responseText);
  }
  xhr.send();

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

function onlineUpdate() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/admin/online/update", true);
  xhr.onload = ()=>{
      alert(xhr.responseText);
  }
  xhr.send();

}
