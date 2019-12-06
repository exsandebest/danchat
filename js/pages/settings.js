function save() {
   var colorValue = document.getElementById("color").value;
   var scrollValue = document.getElementById("scroll").checked;
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/change-settings", true);
   xhr.onload = () => {
      if (xhr.status == 200) {
         document.getElementById("notif").setAttribute("style", "opacity:0");
         document.getElementById("notif").innerHTML = "<notificationGood>Настройки успешно сохранены</notificationGood>";
         document.getElementById("notif").setAttribute("style", "opacity:1");
         setTimeout(() => {
            document.getElementById("notif").setAttribute("style", "opacity:0");
         }, 100000);
      }
   }
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.send("color=" + colorValue + "&scroll=" + scrollValue);
}
