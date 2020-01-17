console.time("Module => ResponseObject");

var ResponseObject = function(status = true, text = "", text2 = "") {
   this.status = status;
   this.text = text;
   this.text2 = text2;
}

module.exports = ResponseObject;

console.timeEnd("Module => ResponseObject");
