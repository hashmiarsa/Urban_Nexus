const router = require("express").Router()
const c = require("../controllers/complaintsController")
const { protect } = require("../middleware/auth")
router.get("/",        c.getComplaints)
router.get("/:id",     c.getComplaint)
router.post("/",       c.createComplaint)
router.put("/:id",     protect, c.updateStatus)
module.exports = router
