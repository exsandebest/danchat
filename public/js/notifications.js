socket.on(getCookie("danchat.token"), function(update) {
   let title = "Уведомление";
   let timeout = 20000; // 20 sec
   let template = `<a class="login" href="/u/${update.login}"><b style="color:${update.color}">${update.login}</b></a> `;
   if (update.type === "newIncomingRequest") {
      VanillaToasts.create({
         title,
         text: `${template}(${update.name}) хочет с вами дружить`,
         type: "info",
         callback: ()=>{
            location = "/incoming"
         },
         timeout
      });
   } else if (update.type === "acceptOutcomingRequest") {
      VanillaToasts.create({
         title,
         text: `${template}(${update.name}) принял${update.sex?"":"а"} вашу заявку`,
         type: "success",
         callback: ()=>{
            location = "/friends"
         },
         timeout
      });
   } else if (update.type === "deletingFromFriends") {
      VanillaToasts.create({
         title,
         text: `${template}(${update.name}) удалил${update.sex?"":"а"} вас из друзей`,
         type: "error",
         callback: ()=>{
            location = "/friends"
         },
         timeout
      });
   }
})
