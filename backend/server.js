const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/auth",       require("./src/routes/auth"))
app.use("/api/projects",   require("./src/routes/projects"))
app.use("/api/conflicts",  require("./src/routes/conflicts"))
app.use("/api/complaints", require("./src/routes/complaints"))
app.use("/api/users",      require("./src/routes/users"))
app.use("/api/audit",      require("./src/routes/audit"))
app.use("/api/notifications", require("./src/routes/notifications"))

// DB + Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected")
    app.listen(process.env.PORT || 5000, () =>
      console.log("CIVIQ Backend running on port", process.env.PORT || 5000)
    )
  })
  .catch(err => console.error("DB connection failed:", err))
