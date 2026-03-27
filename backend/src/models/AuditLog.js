const mongoose = require("mongoose")

const auditSchema = new mongoose.Schema({
  action:     { type: String, required: true },
  performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targetType: { type: String },
  targetId:   { type: mongoose.Schema.Types.ObjectId },
  details:    { type: Object },
  isOverride: { type: Boolean, default: false },
  ipAddress:  { type: String },
}, { timestamps: true })

module.exports = mongoose.model("AuditLog", auditSchema)
