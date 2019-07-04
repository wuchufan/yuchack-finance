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
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));



//gridfs
const mongoURI = "mongodb://localhost:27017/newsImageDB";
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true
});
mongoose.connect("mongodb://localhost:27017/newsDB", {
  useNewUrlParser: true
});

//connect GridFS and Mongo
let gfs;
conn.once('open', function() {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

//mongoose schema
const newsSchema = {
  newsTitle: String,
  newsDate: String,
  newsBody: String,
  newsLBBody: Array,
  newsImage: String
};

//create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  options: {
    useNewUrlParser: true
  },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage
});

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

  newsModel.find({}, function(err, foundNews) {
    if (!err) {
      console.log(foundNews);
      res.render("news", {
        foundNews: foundNews //a list, elements are objects
      });
    }
  });
});
//route: GET /news/single/:post/delete
//desc: going to individual news post

app.get("/news/single/:post/delete", function(req, res) {
  //getting image filename
  newsModel.findById({
    _id: req.params.post
  }, function(err, foundNews) {
    //check weather image is uploaded
    if (foundNews.newsImage !== 'No Image Uploaded') {
      //removing image from Gridfs
      gfs.remove({
        filename: foundNews.newsImage,
        root: 'uploads'
      }, (err, gridStore) => {
        if (err) {
          return res.status(404).json({
            err: err
          });
        }
      });
    }

  });

  //removing article from MongoDb
  newsModel.findOneAndDelete({
    _id: req.params.post
  }, function(err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/news");
});

//route: GET /news/single/:post
//desc: going to individual news post
app.get("/news/single/:post", function(req, res) {
  newsModel.findById({
    _id: req.params.post
  }, function(err, foundNews) {
    // console.log(foundCompose);

    res.render("news-post", {
      newsTitle: foundNews.newsTitle,
      newsDate: foundNews.newsDate,
      newsLBBody: foundNews.newsLBBody,
      newsImage: foundNews.newsImage
    });
  });
});

app.get("/news/compose", function(req, res) {
  res.render("compose");
});

app.post("/news/compose", upload.single('file1'), function(req, res) {

  //title
  const newsTitle = req.body.newsTitle;
  //article paragraphs
  const newsBody = req.body.newsBody;
  // article paragraphs broke in seperated paragraphs
  const newsLBBody = req.body.newsBody.split("\r\n");
  var newsImage;
  // check if there's input
  if (typeof(req.file) !== 'undefined') {
    //give name of uploaded file/image
    newsImage = req.file.filename;
  } else {
    newsImage = 'No Image Uploaded';
  }


  var day = getTodayDate();

  const newNews = new newsModel({
    newsTitle: newsTitle,
    newsDate: day,
    newsBody: newsBody,
    newsLBBody: newsLBBody,
    newsImage: newsImage
  });

  newNews.save(function(err, doc) {
    if (!err) {
      console.log("New news saved succeessful");
    } else {
      console.log(err);
    }
    res.redirect("/news");
  });
});

//@route GET /files
//@desc Display all files in JSON
app.get("/files", function(req, res) {

  gfs.files.find().toArray(function(err, files) {
    //check if files
    if (!files || files.length === 0) {
      res.status(404).json({
        err: "no files"
      });
    } else {
      //file exists
      res.json(files);
    }

  });
});

//@route GET /image/:filename
//@desc display single file object


app.get("/news/image/:filename", function(req, res) {

  gfs.files.findOne({
    filename: req.params.filename
  }, function(err, file) {
    //check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'no file exists'
      });
    }
    // check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      //Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'not image'
      });
    }
  });
});



app.get("/news/single/:post/edit", function(req, res) {
  newsModel.findById({
    _id: req.params.post
  }, function(err, foundNews) {

    res.render("edit", {
      foundNews: foundNews

    });
  });
});


app.post("/news/single/:post/edit", upload.single('file1'), function(req, res) {

  //title
  const newsTitle = req.body.newsTitle;
  //article paragraphs
  const newsBody = req.body.newsBody;
  // article paragraphs broke in seperated paragraphs
  const newsLBBody = req.body.newsBody.split("\r\n");
  //have access to News posts properties
  newsModel.findById({
    _id: req.params.post
  }, function(err, foundNews) {
    var newsImage = foundNews.newsImage;
    //check if uploaded new image file
    if (typeof(req.file) !== 'undefined') {
      //if yes
      //check if originally had image
      if (newsImage !== 'No Image Uploaded') {
        //if yes
        //remove the original image
        gfs.remove({
          filename: newsImage,
          root: 'uploads'
        }, (err, gridStore) => {
          if (err) {
            return res.status(404).json({
              err: err
            });
          }
        });
      }
      //upload new image
      newsImage = req.file.filename;
    }

    newsModel.findOneAndUpdate({
      _id: req.params.post
    }, {
      newsTitle: newsTitle,
      newsBody: newsBody,
      newsLBBody: newsLBBody,
      newsImage: newsImage

    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/news");
      }
    });
  });
});


app.listen(3000, function() {
  console.log("server is up at 3000");
});

//------------------------------------- The followings are functions -------------------------------


//getting today's date
function getTodayDate() {

  var today = new Date();
  var options = {
    year: "numeric",
    month: "long",
    day: "numeric"
  };

  return today.toLocaleDateString("en-US", options);
}
