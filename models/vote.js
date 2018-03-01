var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const VoteSchema = new Schema({
  birth_id: String,
  post_id: String,
  value: Number
});

module.exports = mongoose.models.Vote || mongoose.model(
  'Vote', VoteSchema
);
