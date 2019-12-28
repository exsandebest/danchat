function registration() {
   var login = encodeURI(val("login"));
   var password = encodeURI(val("password"));
   var firstname = encodeURI(val("firstname"));
   var lastname = encodeURI(val("lastname"));
   var age = val("age");
   var sex = val("sex");
   var submit = val("submit");
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/registration", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      console.log(xhr.responseText);
      if (xhr.responseText.split(":")[0] == "false") {
         notif("Bad", xhr.responseText.split(":")[1].split("\n\n")[0], xhr.responseText.split(":")[1].split("\n\n")[1], 10000);
      } else if (xhr.responseText.split(":")[0] === "true") {
         notif("Good", "Вы успешно зарегестрированы!", "", 9999999);
         setTimeout(() => {
            location = "/login";
         }, 3000);
      } else {
         notif("Bad", "Проблемы с сервером. Приносим свои извинения", "Попробуйте позже", 5000);
      }
   }
   xhr.onerror = xhr.onabort = () => {
      notif("Bad", "Проблемы с сервером. Приносим свои извинения", "Попробуйте позже", 5000);
   }
   xhr.send(JSON.stringify({
      login : login,
      password : password,
      firstname : firstname,
      lastname : lastname,
      age : age,
      sex : sex,
      submit : submit
   }));

}

function val(id) {
   return document.getElementById(id).value;
}

function notif(type, msg1, msg2, time) {
   document.getElementById("notification").setAttribute("style", "opacity:0");
   document.getElementById("notification").innerHTML = "<notification" + type + ">" + msg1 + "</notification" + type + "><br><br><span class='orange'>" + msg2 + "</span>";
   document.getElementById("notification").setAttribute("style", "opacity:1");
   setTimeout(() => {
      document.getElementById("notification").setAttribute("style", "opacity:0");
   }, time);
}
