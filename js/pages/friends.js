function delFriend(friendLogin) {
   if (confirm("Вы действительно хотите удалить " + friendLogin + " из друзей?")) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/user/delete/friend", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
         if (JSON.parse(xhr.responseText).status) {
            location.reload();
         } else {
            alert(`Ошибка: ${xhr.responseText}`);
         }
      }
      xhr.send(JSON.stringify({
         login : friendLogin
      }));
   }
}
