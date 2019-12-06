if (confirm("Вы действительно хотите удалить " + friendLogin + " из друзей?")) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/delete/friend", true);
   xhr.onload = () => {
      if (xhr.responseText == "true") {
         alert("Успешно.");
         location.reload();
      }
   }
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.send("friend=" + friendLogin);
}
