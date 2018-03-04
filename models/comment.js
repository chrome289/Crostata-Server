var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const CommentSchema = new Schema({
  post_id: String,
  birth_id: String,
  text: String,
  time_created: Date,
  is_censored: Boolean,
  is_generated: Boolean,
});

module.exports = mongoose.models.Comment || mongoose.model(
  'Comment', CommentSchema
);
