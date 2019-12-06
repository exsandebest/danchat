  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/user/add/friend", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = () => {
     if (xhr.responseText == "true") {
        alert("Успешно!")
        location.reload();
     }
  }
  xhr.send("friend=" + friendLogin);
