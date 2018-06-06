var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const ReportSchema = new Schema({
  timeCreated: Date,
  contentId: String,
  contentType: Number,
  creatorId: String,
  creatorName: String,
  reporterId: String,
  isReviewed: Boolean,
  isAccepted: Boolean,
});

module.exports = mongoose.models.Report || mongoose.model(
  'Report', ReportSchema
);
