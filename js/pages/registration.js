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
      if (xhr.status == 200) {
         var obj = JSON.parse(xhr.responseText);
         if (obj.status){
            notif("Good", "Вы успешно зарегестрированы!", "", 9999999);
            setTimeout(() => {
               location = "/login";
            }, 3000);
         } else {
            notif("Bad", obj.text.split("\n\n")[0], obj.text.split("\n\n")[1], 10000);
         }
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
   var elem = document.getElementById("notification");
   elem.setAttribute("style", "opacity:0");
   elem.innerHTML = `<span class = "notification${type}">${msg1}</span><br><br><span class='orange'>${msg2}</span>`;
   elem.setAttribute("style", "opacity:1");
   setTimeout(() => {
      elem.setAttribute("style", "opacity:0");
   }, time);
}
