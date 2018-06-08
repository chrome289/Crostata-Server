var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PostSchema = new Schema({
  creatorId: String,
  creatorName:String,
  timeCreated: Date,
  contentType: String,
  text: String,
  imageId: String,
  likes: Number,
  comments: Number,
  isCensored: Boolean,
  isGenerated: Boolean,
});

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
