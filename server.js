const express = require("express");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const axios = require("axios");
const Handlebars = require("handlebars");

//most likely dont need this mongojs or body-parser
const mongojs = require("mongojs");
const bodyParser = require("body-parser");

// Setting the Default Port for Express and Heroku
const PORT = process.env.PORT || 8080;

// Connect to the Mongo DB
//environment variable
var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

var db = require("./models");
var app = express();

//configuring middleware//

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Make public a static folder
app.use(express.static("public"));

Handlebars.registerHelper("link", function(text, url) {
  url = Handlebars.escapeExpression(text);
  text = Handlebars.escapeExpression(text);
  console.log(`URL: ${url}`);
  console.log(`TEXT: + ${text}`);
  return new Handlebars.SafeString("<a href='" + url + "'>" + text + "</a>");
});

//When the server starts this will create and save a new Comments document to the database
// The "unique" rule in the Comments model's schema will prevent duplicate comments from being added
db.Comments.create({ comment: "user comments" })
  .then(function(dbComments) {
    // If saved successfully, print the new Comments document to the console
    console.log(dbComments);
  })
  .catch(function(err) {
    // If an error occurs, print it to the console
    console.log(err.message);
  });

// Routes
// Main route
app.get("/", function(req, res) {
  db.News.find({})
    .sort({ date: -1 })
    .then(function(data) {
      res.render("index", { article: data });
    });
});

app.get("/all", function(req, res) {
  db.News.find({}).then(function(data) {
    res.json(data);
  });
});

// Route for grabbing a specific Article by id, populate it with the comment
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.News.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comments")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//News scrape route
app.get("/", function(req, res) {
  axios
    .get("https://www.infowars.com/category/featured-stories/")
    .then(function(response) {
      // Load the html body from axios into cheerio
      var $ = cheerio.load(response.data);
      // For each element with a "title" class
      $(".article-content").each(function(i, element) {
        // Save the text and href of each link enclosed in the current element
        var summary = $(element)
          .children("h4")
          .text();
        var headline = $(element)
          .children("h3")
          .children("a")
          .text();
        var link = $(element)
          .children("h3")
          .children("a")
          .attr("href");

        // Create the data in the News db
        db.News.create(
          {
            headline: headline,
            summary: summary,
            url: link
          },
          function(err, inserted) {
            if (err) {
              // Log the error if one is encountered during the query
              console.log(err);
            } else {
              // Otherwise, log the inserted data
              console.log(inserted);
            }
          }
        )
      });
      res.render('index',{articles:result});  
    });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});

app.post("/save/:id", function(req, res) {
  console.log("params id: " + req.params.id);
  db.Comments.create(req.params.id)
    .then(function(comments) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.comments.findOneAndUpdate(
        { _id: req.params.id },
        { note: comments._id },
        { new: true }
      );
    })
    .then(function(dbcomments) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbcomments);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
app.get('/comments', function(req, res){
    db.Comments.find().sort({ createdAt: -1 }).exec(function(err, data) { 
      if(err) throw err;
      res.render('comments',{comments:data});
    });
  });
  
app.post("/addcomment/:id", function(req, res) {
  console.log("*" + req.params.id);
  db.Comments.create({
    article_id: req.params.id,
    comment: req.body.comment

  },function(err, docs){    
    if(err){
      console.log(err);     
    } else {
      console.log("New Comment Added");
    }
    res.redirect('/comments');
  });
  
});

app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});
