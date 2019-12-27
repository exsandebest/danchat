var friends = [];
onload();
counters();

function onload() {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", "/user/get/outreqs/data", true);
   xhr.onload = () => {
      friends = JSON.parse(xhr.responseText);
      friends.forEach((user) => {
         var block = document.createElement("div");
         var dataBlock = document.createElement("div");
         var funcBlock = document.createElement("div");
         var img = document.createElement("img");
         var delbtn = document.createElement("buttons");
         block.id = "block";

         if (user.imgStatus === true) {
            img.src = user.login + ".jpg";
         } else {
            img.src = "default.jpg";
         }
         block.appendChild(img);

         dataBlock.id = "datablock";
         dataBlock.innerHTML = `<br><a id="login"
      href="/u/${user.login}"
      style="color:${user.color};">
      ${user.login}</a>
      <p id="fullname">${user.firstname} ${user.lastname}<p>`;
         block.appendChild(dataBlock);


         funcBlock.id = "funcblock";

         delbtn.setAttribute("class", "small");
         delbtn.style = "width: 125px";
         delbtn.innerHTML = "Отменить заявку";
         delbtn.setAttribute("onclick", "cancelOutcomingRequest('" + user.login + "')");

         funcBlock.appendChild(delbtn);
         dataBlock.appendChild(funcBlock);

         document.getElementById("list").appendChild(block);
         document.getElementById("list").appendChild(document.createElement("br"));
      })
   }
   xhr.send();
}

function cancelOutcomingRequest(userlogin) {
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/user/cancel/outcomingrequest", true);
   xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
   xhr.onload = () => {
      if (xhr.responseText == "true") {
         location.reload();
      }
   }
   xhr.send("user=" + userlogin);


}


function counters() {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", "/get/inreqs/count", true);
   xhr.onload = () => {
      if (Number(xhr.responseText) != 0) {
         document.getElementById("inreqsCounter").innerHTML = " " + xhr.responseText + " ";
      }
   }
   xhr.onerror = xhr.onabort = () => {};
   xhr.send();


   var xhr2 = new XMLHttpRequest();
   xhr2.open("GET", "/get/outreqs/count", true);
   xhr2.onload = () => {
      if (Number(xhr2.responseText) != 0) {
         document.getElementById("outreqsCounter").innerHTML = " " + xhr2.responseText + " ";
      }
   }
   xhr2.send();
}
