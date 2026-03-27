const mongoose = require("mongoose")

const complaintSchema = new mongoose.Schema({
  cnrId:       { type: String, unique: true },
  issueType:   { type: String, enum: ["pothole","streetlight","water_leak","garbage","drainage","other"], required: true },
  description: { type: String, required: true },
  location: {
    address:    { type: String },
    ward:       { type: String },
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    }
  },
  photoUrl:    { type: String },
  status: {
    type: String,
    enum: ["submitted","acknowledged","in_progress","resolved"],
    default: "submitted"
  },
  assignedDepartment: { type: String },
  assignedOfficer:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolutionNote:     { type: String },
}, { timestamps: true })

// Auto-generate CNR ID
complaintSchema.pre("save", async function(next) {
  if (!this.cnrId) {
    const count = await mongoose.model("Complaint").countDocuments()
    this.cnrId = "CNR-" + String(100000 + count + 1).padStart(6, "0")
  }
  next()
})

module.exports = mongoose.model("Complaint", complaintSchema)
