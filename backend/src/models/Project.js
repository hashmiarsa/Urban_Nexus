const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  projectId:       { type: String, unique: true },
  department:      { type: String, required: true },
  projectType:     { type: String, enum: ["road","water","sewage","electricity","parks","other"], required: true },
  description:     { type: String, required: true },
  phase:           { type: String, enum: ["standalone","phase1","continuation"], default: "standalone" },
  parentProject:   { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  phaseNumber:     { type: Number, default: 1 },

  // Timeline
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
  actualEndDate:   { type: Date },

  // Budget
  estimatedCost:   { type: Number },
  budgetSource:    { type: String },
  tenderNumber:    { type: String },
  contractorName:  { type: String },
  contractorFirm:  { type: String },

  // Location
  location: {
    roadName:       { type: String },
    neighbourhood:  { type: String },
    ward:           { type: String },
    zone:           { type: String },
    city:           { type: String, default: "Ghaziabad" },
    state:          { type: String, default: "Uttar Pradesh" },
    address:        { type: String },
    centerCoords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    shape:          { type: String, enum: ["corridor","circle","rectangle","polygon"] },
    length:         { type: Number },
    width:          { type: Number },
    area:           { type: Number },
    buffer:         { type: Number },
    geoJSON:        { type: Object },
  },

  // MCDM
  mcdmScore:       { type: Number },
  mcdmBreakdown:   { type: Object },

  // MCDM Officer Inputs
  mcdmInputs: {
    conditionRating:    { type: String },
    incidents:          [{ type: String }],
    lastWorkYear:       { type: Number },
    tenderStatus:       { type: String },
    contractorAssigned: { type: Boolean },
    roadClosure:        { type: String },
    utilityDisruption:  [{ type: String }],
    disruptionDays:     { type: Number },
  },

  // Status
  status: {
    type: String,
    enum: ["pending","approved","rejected","active","completed","rescheduled"],
    default: "pending"
  },

  // Team
  officer:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Admin
  adminNote:       { type: String },
  rejectionReason: { type: String },
  suggestedDate:   { type: Date },

  // Progress
  progress:        { type: Number, default: 0 },

  // Documents
  documents: [{
    name: String,
    url:  String,
    type: String,
  }],

  // Clashes
  hasClash:   { type: Boolean, default: false },
  clashes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Conflict" }],

}, { timestamps: true })

// Auto-generate project ID
projectSchema.pre("save", async function(next) {
  if (!this.projectId) {
    const count = await mongoose.model("Project").countDocuments()
    this.projectId = "PRJ-" + String(count + 1).padStart(4, "0")
  }
  next()
})

module.exports = mongoose.model("Project", projectSchema)
