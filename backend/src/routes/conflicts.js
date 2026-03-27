const router = require("express").Router()
const c = require("../controllers/conflictsController")
const { protect, authorize } = require("../middleware/auth")
router.use(protect)
router.get("/",                c.getConflicts)
router.put("/:id/resolve",     authorize("admin"),   c.resolveConflict)
router.put("/:id/respond",     authorize("officer"), c.officerRespond)
module.exports = router
