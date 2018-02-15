var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const SubjectSchema = new Schema({
  birth_id: String,
  name: String,
  password: String,
  class: Number,
  profession: String,
  picture: String,
  patriot_index: Number,
  status: String,
  informer: Boolean
});

module.exports = mongoose.model(
  'Subject', SubjectSchema
);
