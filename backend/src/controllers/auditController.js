const AuditLog = require("../models/AuditLog")

exports.getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy","name role department")
      .sort("-createdAt")
      .limit(200)
    res.json(logs)
  } catch (err) { res.status(500).json({ message: err.message }) }
}
