function acceptIncomingRequest(userLogin) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/accept/incomingRequest", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.responseText === "true") {
         location.reload();
      } else {
         alert(`Ошибка: ${xhr.responseText}`);
      }
   }
   xhr.send(JSON.stringify({
      login : userLogin
   }));
}
