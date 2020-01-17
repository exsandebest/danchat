function save() {
   var colorValue = document.getElementById("color").value;
   var scrollValue = document.getElementById("scroll").checked;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/change/settings", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      var elem = document.getElementById("notif");
      elem.setAttribute("style", "opacity:0");
      if (xhr.status == 200 && JSON.parse(xhr.responseText).status) {
         elem.innerHTML = "<span class='notificationGood'>Настройки успешно сохранены</span>";
      } else {
         elem.innerHTML = `<span class='notificationBad'>Ошибка при сохранении</span>`;
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
