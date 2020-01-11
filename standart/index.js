console.time("Module => standart");
exports.getCookie = (req, name) => {
   try {
      var matches = req.headers.cookie.match(new RegExp(
         "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
      ));
      return matches ? decodeURIComponent(matches[1]) : false;
   } catch (e) {
      console.error(e);
      return false;
   }
}



exports.genToken = () => {
   var text = "";
   var possible = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890__";
   for (var i = 0; i < 30; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
   return text;
}

console.timeEnd("Module => standart");
