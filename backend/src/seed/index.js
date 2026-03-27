const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
dotenv.config()

const User = require("../models/User")
const Complaint = require("../models/Complaint")

const users = [
  { name:"Rajesh Kumar",  email:"admin@civiq.in",      password:"civiq123", role:"admin",      department:"Municipal",  initials:"RK" },
  { name:"Amit Sharma",   email:"officer@civiq.in",    password:"civiq123", role:"officer",    department:"PWD",        initials:"AS" },
  { name:"Mohan Kumar",   email:"officer2@civiq.in",   password:"civiq123", role:"officer",    department:"Jal Nigam",  initials:"MK" },
  { name:"Vinay Pandey",  email:"officer3@civiq.in",   password:"civiq123", role:"officer",    department:"PVVNL",      initials:"VP" },
  { name:"Suresh Singh",  email:"supervisor@civiq.in", password:"civiq123", role:"supervisor", department:"PWD",        initials:"SS" },
]

const complaints = [
  { issueType:"pothole",    description:"Large pothole on MG Road near Vijay Chowk", location:{ address:"MG Road, Vijay Nagar", ward:"Ward 12", coords:{ lat:28.6692, lng:77.4538 } }, status:"submitted" },
  { issueType:"water_leak", description:"Water leaking from main pipeline since 3 days", location:{ address:"Sector 5, Vaishali", ward:"Ward 8",  coords:{ lat:28.6450, lng:77.3600 } }, status:"acknowledged" },
  { issueType:"pothole",    description:"Multiple potholes causing accidents at night", location:{ address:"GT Road, Ghaziabad", ward:"Ward 12", coords:{ lat:28.6730, lng:77.4560 } }, status:"submitted" },
  { issueType:"streetlight",description:"3 streetlights not working for 2 weeks",      location:{ address:"Raj Nagar, Ghaziabad",ward:"Ward 5",  coords:{ lat:28.6500, lng:77.4200 } }, status:"in_progress" },
  { issueType:"drainage",   description:"Blocked drain causing waterlogging in monsoon", location:{ address:"Lohia Nagar",       ward:"Ward 14", coords:{ lat:28.6600, lng:77.4400 } }, status:"submitted" },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  await User.deleteMany()
  await Complaint.deleteMany()
  await User.insertMany(users)
  await Complaint.insertMany(complaints)
  console.log("Seeded users and complaints successfully")
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
