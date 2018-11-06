const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const axios = require('axios');
var mongojs = require("mongojs");

var PORT = 3000;

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

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

// Hook mongojs configuration to the db variable
// var db = mongojs(databaseUrl, collections);
// db.on("error", function(error) {
//   console.log("Database Error:", error);
// });

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
    res.send("Hello world");
  });

//When the server starts this will create and save a new Comments document to the database
// The "unique" rule in the Comments model's schema will prevent duplicate comments from being added 
db.Comments.create({ name: "user comments" })
  .then(function(dbComments) {
    // If saved successfully, print the new Comments document to the console
    console.log(dbComments);
  })
  .catch(function(err) {
    // If an error occurs, print it to the console
    console.log(err.message);
  });

  // Routes










  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });