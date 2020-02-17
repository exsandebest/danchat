console.time("Module => ResponseObject");

const ResponseObject = function(status = true, text = "", text2 = "") {
    this.status = status;
    this.text = text;
    this.text2 = text2;
}

module.exports = ResponseObject;

console.timeEnd("Module => ResponseObject");
