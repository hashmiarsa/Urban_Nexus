const mongoose = require("mongoose")

const conflictSchema = new mongoose.Schema({
  project1:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  project2:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  clashTypes:  [{ type: String, enum: ["geographic","timeline","worktype"] }],
  severity:    { type: String, enum: ["incompatible","conditional"], default: "incompatible" },
  status: {
    type: String,
    enum: ["pending","resolved_both","resolved_rejected","awaiting_officer"],
    default: "pending"
  },
  adminResolution: {
    action:           { type: String, enum: ["approve_both","reject_lower"] },
    coordinationNote: { type: String },
    overrideCategory: { type: String },
    overrideReason:   { type: String },
    overrideRef:      { type: String },
    resolvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt:       { type: Date },
  },
  officerResponse: {
    action:       { type: String, enum: ["accept","custom"] },
    customDate:   { type: Date },
    respondedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    respondedAt:  { type: Date },
  },
  suggestedDate:   { type: Date },
  recheckPassed:   { type: Boolean },
}, { timestamps: true })

module.exports = mongoose.model("Conflict", conflictSchema)
