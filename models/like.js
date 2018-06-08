var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const LikeSchema = new Schema({
  birthId: String,
  postId: String
});

module.exports = mongoose.models.Like || mongoose.model(
  'Like', LikeSchema
);
