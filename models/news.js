var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new newsSchema object
// This is similar to a Sequelize model
var newsSchema = new Schema({
  // `author` must be of type String
  headline: String,
  // `title` must be of type String
  summary: String,
  // URL must be of type String
  url: String
});

// This creates our model from the above schema, using mongoose's model method
var News = mongoose.model("News", newsSchema);

// Export the Book model
module.exports = News;
