function changePasword() {
   var oldPassword = val("oldPassword");
   var newPassword = val("newPassword");
   var repeatNewPassword = val("repeatNewPassword");
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/change/password", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.status == 200) {
         var obj = JSON.parse(xhr.responseText);
         if (obj.status){
            notif(1, "Good", obj.text.split("\n\n")[0], obj.text.split("\n\n")[1], 100000);
            document.getElementById("oldPassword").innerHTML = "";
            document.getElementById("newPassword").innerHTML = "";
            document.getElementById("repeatNewPassword").innerHTML = "";
         } else {
            notif(1, "Bad", obj.text.split("\n\n")[0], obj.text.split("\n\n")[1], 10000);
         }
      } else {
         notif(1, "Bad", "Проблемы с сервером. Приносим свои извинения", "Попробуйте позже", 10000);
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
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.status == 200) {
         var obj = JSON.parse(xhr.responseText);
         if (obj.status){
            notif(2, "Good", obj.text.split("\n\n")[0], obj.text.split("\n\n")[1], 100000);
         } else {
            notif(2, "Bad", obj.text.split("\n\n")[0], obj.text.split("\n\n")[1], 10000);
         }
      } else {
         notif(2, "Bad", "Проблемы с сервером. Приносим свои извинения", "Попробуйте позже", 10000);
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
   var elem;
   if (num === 1){
      elem = document.getElementById("notif");
   } else {
      elem = document.getElementById("notif2");
   }
   elem.setAttribute("style", "opacity:0");
   elem.innerHTML = `<span class='notification${type}'>${msg1}</span><br><span class = 'orange'>${msg2}</span>`;
   elem.setAttribute("style", "opacity:1");
   setTimeout(() => {
      elem.setAttribute("style", "opacity:0");
   }, time);
}









function val(id) {
   return document.getElementById(id).value;
}
