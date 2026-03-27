const Complaint = require("../models/Complaint")

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort("-createdAt")
    res.json(complaints)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      $or: [{ _id: req.params.id }, { cnrId: req.params.id }]
    })
    if (!complaint) return res.status(404).json({ message: "Complaint not found" })
    res.json(complaint)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body)
    res.status(201).json(complaint)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, resolutionNote: req.body.note },
      { new: true }
    )
    res.json(complaint)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
