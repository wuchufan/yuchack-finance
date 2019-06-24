const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();


mongoose.connect("mongodb://localhost:27017/blogDB", {
  useNewUrlParser: true
});

//mongoose schema
const newsSchema = {
  newsTitle: String,
  newsDate: String,
  newsBody: String,
  newsLBBody: Array
};

//mongoose model
const newsModel = mongoose.model("news", newsSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"))

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
  res.render("news");
});

app.get("/news/compose", function(req, res) {
  const newsTitle = req.body.newsTitle; //title
  const newsBody = req.body.newsBody; //article paragraphs
  const newsLBBody = req.body.newsBody.split("\r\n"); // article paragraphs broke in seperated paragraphs

  //getting today's date
  var today = new Date();
  var options = {
    year:"numeric",
    month:"long",
    day:"numeric"
  };
  var day = today.toLocaleDateString("en-US",options);

  const newNews = new newsModel ({
    newsTitle: newsTitle,
    newsDate: day,
    newsBody: newsBody,
    newsLBBody: newsLBBody
  });
  res.render("compose");
})

app.get("/edit", function(req, res) {
  res.render("edit")
})


app.listen(3000, function() {
  console.log("server is up at 3000");
});
