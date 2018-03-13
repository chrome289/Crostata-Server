var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const CommentSchema = new Schema({
  postId: String,
  birthId: String,
  text: String,
  timeCreated: Date,
  isCensored: Boolean,
  isGenerated: Boolean,
});

module.exports = mongoose.models.Comment || mongoose.model(
  'Comment', CommentSchema
);
