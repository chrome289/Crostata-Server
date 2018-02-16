var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const SubjectSchema = new Schema({
  birth_id: String,
  name: String,
  password: String,
  dob: Date,
  profession: String,
  gender: Number,
  picture: String,
  patriot_index: Number,
  alive: Boolean,
  informer: Boolean
});

module.exports = mongoose.models.Subject || mongoose.model(
  'Subject', SubjectSchema
);
