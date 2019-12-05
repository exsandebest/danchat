var xhr = new XMLHttpRequest();
  xhr.open("POST", "/user/cancel/outcomingrequest", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onload = ()=>{
    if (xhr.responseText == "true"){
      location.reload();
    }
  }
  xhr.send("user="+userlogin);
