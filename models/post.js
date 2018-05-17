var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PostSchema = new Schema({
  creatorId: String,
  creatorName:String,
  timeCreated: Date,
  contentType: String,
  title: String,
  text: String,
  imageId: String,
  upVotes: Number,
  downVotes: Number,
  comments: Number,
  isCensored: Boolean,
  isGenerated: Boolean,
});

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
