function save() {
   var colorValue = document.getElementById("color").value;
   var scrollValue = document.getElementById("scroll").checked;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/change/settings", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      var elem = document.getElementById("notif");
      elem.setAttribute("style", "opacity:0");
      var res = JSON.parse(xhr.responseText);
      if (xhr.status == 200 && res.status) {
         elem.innerHTML = `<span class='notificationGood'>${res.text}</span>`;
      } else {
         elem.innerHTML = `<span class='notificationBad'>${res.text}</span>`;
      }
      elem.setAttribute("style", "opacity:1");
      setTimeout(() => {
         elem.setAttribute("style", "opacity:0");
      }, 10000);
   }
   xhr.onerror = xhr.onabort = () => {
      alert("Проблема при отправке запроса");
   }
   xhr.send(JSON.stringify({
      color : colorValue,
      scroll : scrollValue
   }))
}
