"use strict";

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const config = require("./index");

// ---------------------------------------------------------------------------
// Configure Cloudinary SDK with credentials from central config
// Never use process.env directly here — always via config
// ---------------------------------------------------------------------------
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key:    config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------------------------
// Cloudinary storage engine for citizen report photos
// Files are uploaded directly to Cloudinary via multer middleware
// ---------------------------------------------------------------------------
const citizenReportStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "urban-nexus/citizen-reports",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width:   1200,
        height:  1200,
        crop:    "limit",  // never upscale, only shrink if larger
        quality: "auto",   // Cloudinary auto-optimizes quality
      },
    ],
  },
});

// ---------------------------------------------------------------------------
// Multer upload middleware — used in report routes
//
// Usage in routes:
//   const { uploadReportPhoto } = require("../config/cloudinary")
//   router.post("/", uploadReportPhoto.single("photo"), createReport)
// ---------------------------------------------------------------------------
const uploadReportPhoto = multer({
  storage: citizenReportStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, PNG, and WebP images are allowed."
        ),
        false
      );
    }
  },
});

// ---------------------------------------------------------------------------
// deleteFromCloudinary — removes an image by its public ID
// Called when a citizen report is deleted or its photo is replaced
//
// @param  {string} publicId  - Cloudinary public ID of the image to delete
// @returns {object}          - Cloudinary deletion result
// ---------------------------------------------------------------------------
const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadReportPhoto, deleteFromCloudinary };