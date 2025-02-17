require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 📌 Configurar middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Servir archivos estáticos (HTML, CSS, JS)

// 📌 Conectar con la base de datos
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("❌ Error al conectar con la base de datos:", err.message);
    } else {
        console.log("✅ Conectado a la base de datos SQLite");
    }
});

// 📌 Crear la tabla "users" si no existe
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`,
    (err) => {
        if (err) {
            console.error("❌ Error al crear la tabla:", err.message);
        } else {
            console.log("✅ Tabla 'users' verificada o creada con éxito");
        }
    }
);

// 📌 Ruta para registrar un usuario
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    // 📌 Verificar que todos los campos estén completos
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // 🔍 Verificar si el usuario o email ya existen en la base de datos
    db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (row) {
            return res.status(400).json({ message: "Usuario o email ya registrado" });
        }

        // 🔐 Encriptar la contraseña antes de guardar
        const hashedPassword = bcrypt.hashSync(password, 10);

        // 📌 Insertar el usuario en la base de datos
        db.run(
            `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
            [username, email, hashedPassword],
            function (err) {
                if (err) {
                    return res.status(500).json({ message: "Error al registrar usuario" });
                }
                res.json({ message: "✅ Usuario registrado con éxito" });
            }
        );
    });
});

// 📌 Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
