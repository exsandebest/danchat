console.time("Module => crypt");
exports.unEnc = (txt)=>{
  var output = "";
  var Temp = [];
  var Temp2 = [];
  for (var i = 0; i < txt.length; i++) {
    Temp[i] = txt.charCodeAt(i);
    Temp2[i] = txt.charCodeAt(i + 1);
  }
  for (i = 0; i < txt.length; i = i + 2) {
    output += String.fromCharCode(Temp[i] - Temp2[i]);
  }
  return output;
}


exports.enc = (txt)=>{
  var output ="";
  var Temp = [];
  var Temp2 = [];
  for (var i = 0; i < txt.length; i++) {
    var rnd = Math.round(Math.random() * 122) + 68;
    Temp[i] = txt.charCodeAt(i) + rnd;
    Temp2[i] = rnd;
  }
  for (i = 0; i < txt.length; i++) {
    output += String.fromCharCode(Temp[i], Temp2[i]);
  }
  return output;
}
console.timeEnd("Module => crypt");
