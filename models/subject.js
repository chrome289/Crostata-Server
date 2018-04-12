var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const SubjectSchema = new Schema({
  birthId: String,
  name: String,
  password: String,
  dob: Date,
  profession: String,
  gender: Number,
  picture: String,
  patriotIndex: Number,
  alive: Boolean,
  informer: Boolean,
  moneyDonated: Number,
  reportsMade: Number,
  reportsAgainst: Number
});

module.exports = mongoose.models.Subject || mongoose.model(
  'Subject', SubjectSchema
);
