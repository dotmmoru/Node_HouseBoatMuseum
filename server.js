import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3001;

// Set up static folder for uploads
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure CORS
app.use(cors());
app.use("/uploads", express.static(uploadDir));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const today = new Date();
        const dateFolder = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const folderPath = path.join(uploadDir, dateFolder);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage });

// Routes

// POST /upload
app.post("/upload", upload.single("photo"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "No photo uploaded" });
        return;
    }

    res.status(200).json({
        message: "Photo successfully uploaded",
        filename: req.file.filename,
        url: `http://${req.hostname}:${PORT}/uploads/${req.file.filename}`,
    });
});

// GET /photos
app.get("/photos", (req, res) => {
    const photos = [];

    try {
        fs.readdirSync(uploadDir).forEach((folder) => {
            const folderPath = path.join(uploadDir, folder);

            if (fs.statSync(folderPath).isDirectory()) {
                const files = fs.readdirSync(folderPath);
                files.forEach((file) => {
                    photos.push(`/uploads/${folder}/${file}`);
                });
            }
        });
    } catch (err) {
        console.error("Error reading photos:", err);
    }

    res.json({ photos });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
