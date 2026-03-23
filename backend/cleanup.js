require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Project = require("./src/models/Project");
  const Conflict = require("./src/models/Conflict");
  const keepIds = ["69b204466147154137e7e0ec", "69b207d7a207a462017637e9"];
  await Project.deleteMany({ _id: { $nin: keepIds.map(id => new mongoose.Types.ObjectId(id)) } });
  await Conflict.deleteMany({});
  console.log("Cleaned. Remaining:");
  const remaining = await Project.find({}).lean();
  remaining.forEach(p => console.log(" -", p.title));
  process.exit(0);
});