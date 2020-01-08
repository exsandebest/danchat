function save() {
   var colorValue = document.getElementById("color").value;
   var scrollValue = document.getElementById("scroll").checked;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/change/settings", true);
   xhr.setRequestHeader("Content-Type", "application/json");
   xhr.onload = () => {
      if (xhr.status == 200) {
         var elem = document.getElementById("notif");
         elem.setAttribute("style", "opacity:0");
         elem.innerHTML = "<span class='notificationGood'>Настройки успешно сохранены</span>";
         setTimeout(() => {
            elem.setAttribute("style", "opacity:0");
         }, 100000);
      }
   }
   xhr.send(JSON.stringify({
      color : colorValue,
      scroll : scrollValue
   }))
}
