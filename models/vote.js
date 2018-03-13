var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const VoteSchema = new Schema({
  birthId: String,
  postId: String,
  value: Number
});

module.exports = mongoose.models.Vote || mongoose.model(
  'Vote', VoteSchema
);
