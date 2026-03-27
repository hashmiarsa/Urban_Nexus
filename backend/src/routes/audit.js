const router = require("express").Router()
const { getLogs } = require("../controllers/auditController")
const { protect, authorize } = require("../middleware/auth")
router.get("/", protect, authorize("admin"), getLogs)
module.exports = router
