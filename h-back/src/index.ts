import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

// Validar variables de entorno requeridas
const requiredEnvVars = ["CORS_ORIGIN"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Faltan variables de entorno requeridas:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error("💡 Copia .env.example a .env y completa los valores");
  process.exit(1);
}

const app: Express = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN!;
// SERVER_URL es opcional, solo se usa para logs
const SERVER_URL = process.env.SERVER_URL || (process.env.NODE_ENV === "production" 
  ? `https://api.tu-dominio.com` 
  : `http://localhost:${PORT}`);

// Validar que CORS_ORIGIN sea una URL válida
try {
  new URL(CORS_ORIGIN);
} catch {
  console.error("❌ CORS_ORIGIN debe ser una URL válida");
  console.error(`   Valor actual: ${CORS_ORIGIN}`);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en ${SERVER_URL}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS habilitado para: ${CORS_ORIGIN}`);
});

