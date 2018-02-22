var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PostSchema = new Schema({
  post_id: String,
  creator_id: String,
  time_created : Date,
  content_type: String,
  text_url: String,
  pic_url: String,
  up_votes: Number,
  down_votes: Number,
  is_censored: Boolean,
  is_generated: Boolean,
});

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
