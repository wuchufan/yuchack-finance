const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.get("/",function(req,res){
  res.sendFile(__dirname + "/index.html")
});
app.use(express.static("public"))
app.listen(3000,function(){
  console.log("server is up at 3000");
});
