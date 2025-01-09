const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const moment = require("moment"); // підключаємо moment для роботи з датами

const app = express();
const PORT = 3001;

// Дозволити запити з будь-якого пристрою в локальній мережі
app.use(cors());
app.use(express.static("uploads"));

// Створити папку для збереження фото, якщо її немає
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Налаштування multer для зберігання фото
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Генеруємо назву папки на основі поточної дати
        const today = new Date();
        const dateFolder = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const uploadPath = path.join("uploads", dateFolder);

        // Перевіряємо, чи існує папка; якщо ні — створюємо
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Передаємо шлях до папки Multer'у
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Унікальна назва файлу
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname); // Отримуємо розширення файлу
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

const upload = multer({ storage: storage });

// POST-запит на /upload
// Маршрут для завантаження фото
app.post("/upload", upload.single("photo"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "Фото не завантажене" });
    } else {
        res.status(200).json({
            message: "Фото успішно завантажене",
            filename: req.file.filename,
            url: `http://${req.hostname}:${PORT}/uploads/${req.file.filename}`,
        });
    }
});

// GET-запит на /photos
app.get("/photos", (req, res) => {
    const uploadDir = path.join(__dirname, "uploads");

    // Читаємо всі папки і файли в папці `uploads`
    const photos = [];
    try {
        fs.readdirSync(uploadDir).forEach((folder) => {
            const folderPath = path.join(uploadDir, folder);

            // Перевірка, чи це директорія
            if (fs.statSync(folderPath).isDirectory()) {
                // Перевіряємо, чи є фото у папці
                const files = fs.readdirSync(folderPath);
                if (files.length > 0) {
                    files.forEach((file) => {
                        // Лог для перевірки файлів
                        console.log(`Знайдено файл: ${folderPath}/${file}`);

                        // Додаємо фото в масив
                        photos.push(`/uploads/${folder}/${file}`);
                    });
                }
            }
        });

        if (photos.length === 0) {
            console.log("Фотографії не знайдено.");
        }
    } catch (err) {
        console.error("Помилка при читанні папок:", err);
    }

    res.json({ photos });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));




// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущений на http://localhost:${PORT}`);
});