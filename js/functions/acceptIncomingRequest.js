var xhr = new XMLHttpRequest();
xhr.open("POST", "/user/accept/incomingrequest", true);
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
xhr.onload = () => {
   if (xhr.responseText == "true") {
      location.reload();
   }
}
xhr.send("user=" + userlogin);
