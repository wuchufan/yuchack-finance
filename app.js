//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const Grid = require('gridfs-stream');
const crypto = require('crypto');
const path = require('path');
const GridFsStorage = require('multer-gridfs-storage');
const multer = require('multer');
const methodOverride = require('method-override');
const mongoose = require("mongoose");

const app = express();
// app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


//
// //gridfs
// const mongoURI = "mongodb://localhost:27017/newsImageDB";
// const conn = mongoose.createConnection(mongoURI,{
//   useNewUrlParser: true
// });
// mongoose.connect("mongodb://localhost:27017/newsDB", {
//   useNewUrlParser: true
// });
//
// //connect GridFS and Mongo
// let gfs;
// conn.once('open', function(){
//   // Init stream
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection('uploads');
// });

//mongoose schema
const newsSchema = {
  newsTitle: String,
  newsDate: String,
  newsBody: String,
  newsLBBody: Array
};

// //create storage engine
// const storage = new GridFsStorage({
//   url: mongoURI,
//   options:{
//     useNewUrlParser: true
//   },
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) {
//           return reject(err);
//         }
//         const filename = buf.toString('hex') + path.extname(file.originalname);
//         const fileInfo = {
//           filename: filename,
//           bucketName: 'uploads'
//         };
//         resolve(fileInfo);
//       });
//     });
//   }
// });
//
// const upload = multer({storage});

//mongoose model
const newsModel = mongoose.model("news", newsSchema);



//home route
app.get("/", function(req, res) {

  res.render("main");
});

//startup route
app.get("/startup", function(req, res) {
  res.render("startup");
});

//estate route
app.get("/estate", function(req, res) {
  res.render("estate");
});

//news route
app.get("/news", function(req, res) {

  newsModel.find({},function(err,foundNews){
    if (!err){
      console.log(foundNews);
      res.render("news",{
        foundNews:foundNews //a list, elements are objects
      });
    }
  });
});

app.get("/news/compose", function(req, res) {
  res.render("compose");
});

app.post("/news/compose",function(req,res){

  const newsTitle = req.body.newsTitle; //title
  const newsBody = req.body.newsBody; //article paragraphs
  const newsLBBody = req.body.newsBody.split("\r\n"); // article paragraphs broke in seperated paragraphs
  var day = getTodayDate();


  const newNews = new newsModel ({
    newsTitle: newsTitle,
    newsDate: day,
    newsBody: newsBody,
    newsLBBody: newsLBBody
  });

  newNews.save(function(err,doc){
    if (!err){
      console.log("New news saved succeessful");
    } else {
      console.log(err);
    }
    res.redirect("/news");
  });
});

app.get("/edit", function(req, res) {
  res.render("edit");
});




app.listen(3000, function() {
  console.log("server is up at 3000");
});

//------------------------------------- The followings are functions -------------------------------


//getting today's date
function getTodayDate(){

  var today = new Date();
  var options = {
    year:"numeric",
    month:"long",
    day:"numeric"
  };

  return today.toLocaleDateString("en-US",options);
}
