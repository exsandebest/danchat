function acceptIncomingRequest(userLogin) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/accept/incomingrequest", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.responseText == "true") {
         location.reload();
      } else {
         alert(`Ошибка: ${xhr.responseText}`);
      }
   }
   xhr.send(JSON.stringify({
      login : userLogin
   }));
}

function cancelOutcomingRequest(userLogin) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/cancel/outcomingrequest", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.responseText == "true") {
         location.reload();
      } else {
         alert(`Ошибка: ${xhr.responseText}`);
      }
   }
   xhr.send(JSON.stringify({
      login : userLogin
   }));
}

function addFriend(userLogin) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/add/friend", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
     if (xhr.responseText == "true") {
         location.reload();
     } else {
        alert(`Ошибка: ${xhr.responseText}`);
     }
   }
   xhr.send(JSON.stringify({
      login : userLogin
   }));
}

function delFriend(userLogin) {
   if (confirm(`Вы действительно хотите удалить ${userLogin} из друзей?`)) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/user/delete/friend", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
         if (xhr.responseText == "true") {
            location.reload();
         } else {
            alert(`Ошибка: ${xhr.responseText}`);
         }
      }
      xhr.send(JSON.stringify({
         login : userLogin
      }));
   }
}
