const router = require("express").Router()
const c = require("../controllers/usersController")
const { protect, authorize } = require("../middleware/auth")
router.use(protect, authorize("admin"))
router.get("/",           c.getUsers)
router.post("/",          c.createUser)
router.put("/:id",        c.updateUser)
router.put("/:id/toggle", c.toggleUser)
module.exports = router
