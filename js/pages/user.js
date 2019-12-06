var acceptIncomingRequest;
var cancelOutcomingRequest;
var delFriend;
var addFriend;
var userlogin = document.getElementById("userlogin").value;
switch (document.getElementById("userstatus").value) {
   case "subscriber":
      getFunction("acceptIncomingRequest");
      var btn = document.getElementById("button");
      btn.innerHTML = "Принять заявку";
      btn.setAttribute("title", userlogin + " подписан(а) на вас");
      btn.setAttribute("onclick", "useFunction('acceptIncomingRequest','" + userlogin + "')");
      btn.removeAttribute("style");
      break;
   case "request sent":
      getFunction("cancelOutcomingRequest");
      var btn = document.getElementById("button");
      btn.innerHTML = "Отменить заявку";
      btn.setAttribute("title", "Заявка на добавление в друзья отправлена");
      btn.setAttribute("onclick", "useFunction('cancelOutcomingRequest','" + userlogin + "')");
      btn.removeAttribute("style");
      break;
   case "friend":
      getFunction("delFriend");
      var btn = document.getElementById("button");
      btn.innerHTML = "Удалить из друзей";
      btn.setAttribute("onclick", "useFunction('delFriend','" + userlogin + "')");
      btn.removeAttribute("style");
      break;
   case "self":

      break;
   case "default":
      getFunction("addFriend");
      var btn = document.getElementById("button");
      btn.innerHTML = "Добавить в друзья";
      btn.setAttribute("onclick", "useFunction('addFriend','" + userlogin + "')");
      btn.removeAttribute("style");
      break;
   default:
      break;
}


function getFunction(funcName) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", "/app/get/function/" + funcName, true);
   xhr.onload = () => {
      switch (funcName) {
         case "acceptIncomingRequest":
            acceptIncomingRequest = xhr.responseText;
            break;
         case "cancelOutcomingRequest":
            cancelOutcomingRequest = xhr.responseText;
            break;
         case "addFriend":
            addFriend = xhr.responseText;
            break;
         case "delFriend":
            delFriend = xhr.responseText;
         default:
            break;
      }
   }
   xhr.send();
}


function useFunction(funcName, value) {
   switch (funcName) {
      case "acceptIncomingRequest":
         var userlogin = value;
         eval(acceptIncomingRequest);
         break;
      case "cancelOutcomingRequest":
         var userlogin = value;
         eval(cancelOutcomingRequest);
         break;
      case "addFriend":
         var friendLogin = value;
         eval(addFriend);
         break;
      case "delFriend":
         var friendLogin = value;
         eval(delFriend)
      default:
         break;
   }
}
