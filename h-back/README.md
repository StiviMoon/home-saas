# API REST - Sistema de Reportes

Backend API REST para el Sistema de Reportes de Conjuntos Residenciales.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

**Variables requeridas:**
- `CORS_ORIGIN` - URL del frontend (ej: `http://localhost:3000`)
- `FIREBASE_PROJECT_ID` - ID del proyecto Firebase
- `FIREBASE_PRIVATE_KEY` - Private key de Firebase Admin
- `FIREBASE_CLIENT_EMAIL` - Email de la cuenta de servicio

**Variables opcionales:**
- `PORT` - Puerto del servidor (default: 3001)
- `SERVER_URL` - URL completa del servidor (default: `http://localhost:${PORT}`)
- `NODE_ENV` - Ambiente (development/production)

### 3. Verificar conexión a Firestore

Antes de iniciar el servidor, verifica la conexión:

```bash
npm run init:firestore
```

Este comando:
- ✅ Verifica la conexión a Firestore
- ✅ Verifica si la colección `usuarios` existe
- ✅ Muestra la estructura esperada de documentos

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

El servidor estará disponible en la URL configurada en `SERVER_URL` (default: `http://localhost:3001`)

### 5. Compilar para producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
back-h/
├── src/
│   ├── config/          # Configuración (Firebase, etc.)
│   ├── controllers/     # Controladores de las rutas
│   ├── middleware/      # Middleware (auth, etc.)
│   ├── routes/          # Definición de rutas
│   ├── scripts/         # Scripts de utilidad
│   ├── services/        # Lógica de negocio
│   ├── types/           # Tipos TypeScript
│   └── index.ts         # Punto de entrada
├── dist/                # Código compilado (generado)
├── .env                 # Variables de entorno (no commitear)
├── .env.example         # Ejemplo de variables de entorno
├── tsconfig.json        # Configuración TypeScript
└── package.json
```

## 🔌 Endpoints

### Health Check
- `GET /api/health` - Verifica que el servidor esté funcionando
- `GET /api/firestore/health` - Verifica conexión a Firestore

### Firestore
- `GET /api/firestore/users/info` - Información sobre la colección usuarios (requiere auth)

### Usuarios
- `POST /api/users` - Crear usuario (público, después del registro)
- `GET /api/users/me` - Obtener usuario actual (requiere auth)
- `GET /api/users/:id` - Obtener usuario por ID (requiere auth)
- `PUT /api/users/:id` - Actualizar usuario (requiere auth)
- `GET /api/users/conjunto/:conjuntoId` - Obtener usuarios por conjunto (requiere auth)

## 🔐 Autenticación

Todas las rutas protegidas requieren un token de Firebase Auth en el header:

```
Authorization: Bearer <firebase_id_token>
```

El token se obtiene del cliente de Firebase Auth en el frontend.

## 🗄️ Colección de Usuarios

La colección `usuarios` en Firestore se crea automáticamente cuando se inserta el primer documento. 

### Estructura del documento:

```typescript
{
  id: string,              // UUID (mismo que auth_id)
  auth_id: string,         // ID de Firebase Auth
  email: string,          // Email del usuario
  nombre: string,          // Nombre completo
  conjunto_id?: string,    // UUID del conjunto (opcional)
  unidad?: string,         // Número de apartamento/casa (opcional)
  rol: "residente" | "admin" | "super_admin",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Verificar la colección:

```bash
# Usar el script
npm run init:firestore

# O usar el endpoint
curl http://localhost:3001/api/firestore/users/info \
  -H "Authorization: Bearer <token>"
```

## 🛠️ Tecnologías

- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Firebase Admin SDK** - Acceso a Firestore y Auth
- **CORS** - Habilitado para el frontend
- **dotenv** - Variables de entorno

## 📝 Notas

- El backend usa Firebase Admin SDK para acceder a Firestore
- La autenticación se maneja con tokens de Firebase Auth
- El frontend se comunica con este backend en lugar de acceder directamente a Firestore
- La colección `usuarios` se crea automáticamente al insertar el primer documento

## 🔧 Troubleshooting

### Error: "Firebase Admin no está inicializado"
- Verifica que el archivo `.env` existe y tiene las credenciales correctas
- Verifica que `FIREBASE_PRIVATE_KEY` esté correctamente formateado con `\n`

### Error: "Conexión a Firestore fallida"
- Verifica que las credenciales de Firebase Admin sean correctas
- Verifica que el proyecto de Firebase esté activo
- Ejecuta `npm run init:firestore` para diagnosticar

### La colección no aparece en Firebase Console
- La colección se crea automáticamente al insertar el primer documento
- Usa `POST /api/users` para crear el primer usuario y la colección se creará
