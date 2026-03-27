const router = require("express").Router()
const c = require("../controllers/notificationsController")
const { protect } = require("../middleware/auth")
router.use(protect)
router.get("/",         c.getNotifications)
router.put("/read-all", c.markRead)
module.exports = router
