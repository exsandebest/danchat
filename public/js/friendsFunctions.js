function friendsChanges(login, status){
   let url = "";
   if (status === "subscriber"){
      url = "/user/accept/incomingRequest";
   } else if (status === "request sent"){
      url = "/user/cancel/outcomingrequest";
   } else if (status === "friend"){
      url = "/user/delete/friend";
      if (!confirm(`Вы действительно хотите удалить ${login} из друзей?`)) return;
   } else if (status === "default"){
      url = "/user/add/friend";
   }
   fetch(url, {
      method: "POST",
      headers: {
         "Content-Type": "application/json;charset=utf-8"
      },
      body: JSON.stringify({
         login
      })
   }).then(res => {
      if (!res.ok) {
         error(res.status);
      } else {
         res.json().then(data => {
            if (data.status) {
               location.reload();
            } else {
               error(data.text || data);
            }
         }).catch(err => error(err));
      }
   }).catch(err => error(err));
}
