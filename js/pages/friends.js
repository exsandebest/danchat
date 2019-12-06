var friends = [];
onload();
counters();
function onload(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/user/get/friends/data", true);
    xhr.onload = ()=>{
        friends = JSON.parse(xhr.responseText);
        friends.forEach((friend)=>{
            var block = document.createElement("div");
            var dataBlock = document.createElement("div");
            var funcBlock = document.createElement("div");
            var img = document.createElement("img");
            var delbtn = document.createElement("buttons");
            block.id = "block";

            if (friend.imgStatus === true) {
                img.src = friend.login+".jpg";
            } else {
                img.src = "default.jpg";
            }
            block.appendChild(img);
            dataBlock.id = "datablock";
            dataBlock.innerHTML = `<br><a id="login"
      href="/user?${friend.login}"
      style="color:${friend.color};">
      ${friend.login}</a>
      <p id="fullname">${friend.firstname} ${friend.lastname}<p>`;
            block.appendChild(dataBlock);


            funcBlock.id = "funcblock";

            delbtn.setAttribute("class", "small");
            delbtn.innerHTML = "Удалить";
            delbtn.setAttribute("onclick", "delFriend('"+friend.login+"')");

            funcBlock.appendChild(delbtn);
            dataBlock.appendChild(funcBlock);
            document.getElementById("list").appendChild(block);
            document.getElementById("list").appendChild(document.createElement("br"));
        })
    }
    xhr.send();
}





function counters (){
var xhr = new XMLHttpRequest();
xhr.open("GET","/get/inreqs/count",true);
xhr.onload = ()=>{
  if (Number(xhr.responseText) != 0){
  document.getElementById("inreqsCounter").innerHTML = " "+xhr.responseText+" ";
}
}
xhr.onerror = xhr.onabort = ()=>{};
xhr.send();


var xhr2 = new XMLHttpRequest();
xhr2.open("GET","/get/outreqs/count",true);
xhr2.onload = ()=>{
  if (Number(xhr2.responseText) != 0){
  document.getElementById("outreqsCounter").innerHTML = " "+xhr2.responseText+" ";
}
}
xhr2.send();
}

function delFriend(friendLogin) {
    if (confirm("Вы действительно хотите удалить "+friendLogin+ " из друзей?")){
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/user/delete/friend", true);
        xhr.onload = ()=>{
            if(xhr.responseText == "true"){
                alert("Успешно.");
                location.reload();
            }
        }
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send("friend="+friendLogin);
    }
}
