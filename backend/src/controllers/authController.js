const User = require("../models/User")
const jwt = require("jsonwebtoken")

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email, isActive: true })
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" })
    const token = signToken(user._id)
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, initials: user.initials } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMe = async (req, res) => {
  res.json(req.user)
}
