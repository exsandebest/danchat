function cancelOutcomingRequest(userLogin) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/cancel/outcomingrequest", true);
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
