import multer from "multer";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WEBP images are allowed."));
    }
    return cb(null, true);
  },
});

export const parseProfilePhotoUpload = (req, res, next) => {
  upload.single("profilePhoto")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Profile photo must be 8MB or smaller." });
      }
      return res.status(400).json({ message: err.message || "Invalid file upload." });
    }

    return res.status(400).json({ message: err.message || "Invalid file upload." });
  });
};
