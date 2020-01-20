socket.on(getCookie("danchat.token"), function(update) {
   if (update.type === "newIncomingRequest") {
      VanillaToasts.create({
         title: "Уведомление",
         text: `<a class="login" href="/u/${update.login}"><b style="color:${update.color}">${update.login}</b></a> (${update.name}) хочет с вами дружить`,
         type: "info",
         callback: ()=>{
            location = "/incoming"
         },
         timeout:20000
      });
   } else if (update.type === "acceptOutcomingRequest") {
      VanillaToasts.create({
         title: "Уведомление",
         text: `<a class="login" href="/u/${update.login}"><b style="color:${update.color}">${update.login}</b></a> (${update.name}) принял${update.sex?"":"а"} вашу заявку`,
         type: "success",
         callback: ()=>{
            location = "/friends"
         },
         timeout:20000
      });
   } else if (update.type === "deletingFromFriends") {
      VanillaToasts.create({
         title: "Уведомление",
         text: `<a class="login" href="/u/${update.login}"><b style="color:${update.color}">${update.login}</b></a> (${update.name}) удалил${update.sex?"":"а"} вас из друзей`,
         type: "error",
         callback: ()=>{
            location = "/friends"
         },
         timeout:20000
      });
   }
})
