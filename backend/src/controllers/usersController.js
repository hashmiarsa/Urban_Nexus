const User = require("../models/User")

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort("name")
    res.json(users)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password")
    res.json(user)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    user.isActive = !user.isActive
    await user.save()
    res.json({ isActive: user.isActive })
  } catch (err) { res.status(500).json({ message: err.message }) }
}
