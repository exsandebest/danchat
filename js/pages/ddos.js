function go() {
   var n = Number(document.getElementById("count").value);
   var s = document.getElementById("ssilka").value;
   for (var i = 0; i < n; ++i) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", ssilka, false);
      xhr.send();
   }
}
