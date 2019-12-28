function changePasword() {
   var oldPassword = val("oldPassword");
   var newPassword = val("newPassword");
   var repeatNewPassword = val("repeatNewPassword");
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/change/password", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      if (xhr.responseText.split(":")[0] === "true") {
         notif(1, "Good", xhr.responseText.split(":")[1], "", 100000);
         document.getElementById("oldPassword").innerHTML = "";
         document.getElementById("newPassword").innerHTML = "";
         document.getElementById("repeatNewPassword").innerHTML = "";
      } else if (xhr.responseText.split(":")[0] === "false") {
         notif(1, "Bad", xhr.responseText.split(":")[1].split("\n\n")[0], xhr.responseText.split(":")[1].split("\n\n")[1], 10000);
      } else {
         notif(1, "Bad", "Проблемы с сервером, приносим свои извинения", "Попробуйте позже", 10000);
      }
   }
   xhr.onerror = xhr.onabort = () => {
      notif(1, "Bad", "Проблемы с сервером, приносим свои извинения", "Попробуйте позже", 10000);
   }
   xhr.send(JSON.stringify({
      oldPassword : oldPassword,
      newPassword : newPassword,
      repeatNewPassword : repeatNewPassword
   }))
}




function changeName() {
   var firstname = val("firstname");
   var lastname = val("lastname");
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/change/name", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      if (xhr.responseText.split(":")[0] === "true") {
         notif(2, "Good", xhr.responseText.split(":")[1], "", 100000);
      } else if (xhr.responseText.split(":")[0] === "false") {
         notif(2, "Bad", xhr.responseText.split(":")[1].split("\n\n")[0], xhr.responseText.split(":")[1].split("\n\n")[1], 10000);
      } else {
         notif(2, "Bad", "Проблемы с сервером, приносим свои извинения", "Попробуйте позже", 10000);
      }
   }
   xhr.onerror = xhr.onabort = () => {
      notif(2, "Bad", "Проблемы с сервером, приносим свои извинения", "Попробуйте позже", 10000);
   }
   xhr.send(JSON.stringify({
      firstname : firstname,
      lastname : lastname
   }));
}

function notif(num, type, msg1, msg2, time) {
   if (num == 1) {
      document.getElementById("notif").setAttribute("style", "opacity:0");
      document.getElementById("notif").innerHTML = "<notification" + type + ">" + msg1 + "</notification" + type + "><br><span class='orange'>" + msg2 + "</span>";
      document.getElementById("notif").setAttribute("style", "opacity:1");
      setTimeout(() => {
         document.getElementById("notif").setAttribute("style", "opacity:0");
      }, time);
   } else {
      document.getElementById("notif2").setAttribute("style", "opacity:0");
      document.getElementById("notif2").innerHTML = "<notification" + type + ">" + msg1 + "</notification" + type + "><br><span class='orange'>" + msg2 + "</span>";
      document.getElementById("notif2").setAttribute("style", "opacity:1");
      setTimeout(() => {
         document.getElementById("notif2").setAttribute("style", "opacity:0");
      }, time);
   }
}









function val(id) {
   return document.getElementById(id).value;
}
