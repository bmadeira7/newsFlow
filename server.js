const express = require("express");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const axios = require("axios");
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
  res.render("index");
});

//News scrape route
app.get("/api/search", function(req, res) {
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
        );
      });

    //   db.News.find({}, function(error, found) {
    //     // Log any errors if the server encounters one
    //     if (error) {
    //       console.log(error);
    //     }
    //     // Otherwise, send the result of this query to the browser
    //     else {
    //       res.json(found);
    //     }
    //   });
    });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});

app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});
