require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Project = require("./src/models/Project");
  const config = require("./src/config/index");

  console.log("CONFLICT_CHECK_STATUSES:", config.CONFLICT_CHECK_STATUSES);

  const projects = await Project.find({}).lean();
  const firstProject = projects[0];
  const secondProject = projects[1];

  console.log("Project 1:", firstProject.title, "| status:", firstProject.status);
  console.log("Project 2:", secondProject.title, "| status:", secondProject.status);

  const candidates = await Project.find({
    _id: { $ne: secondProject._id },
    status: { $in: config.CONFLICT_CHECK_STATUSES }
  }).lean();

  console.log("Candidates found for Project 2:", candidates.length);
  candidates.forEach(c => console.log(" -", c.title, "| status:", c.status));

  const { detectAllConflicts } = require("./src/engines/conflict/conflict.engine");
  const clashes = detectAllConflicts(secondProject, candidates);
  console.log("Clashes detected by engine:", clashes.length);

  if (clashes.length > 0) {
    console.log("Clash details:", JSON.stringify(clashes[0].overlapDates));
  }

  process.exit(0);
});
