const Notification = require("../models/Notification")

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort("-createdAt").limit(50)
    res.json(notifications)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.markRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { read: true })
    res.json({ message: "All marked as read" })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
