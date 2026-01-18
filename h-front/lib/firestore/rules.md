# Reglas de Firestore

## Colección: usuarios

Esta colección almacena la información de los usuarios del sistema.

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

### Reglas de seguridad recomendadas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección de usuarios
    match /usuarios/{userId} {
      // Solo el usuario puede leer su propio documento
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Solo el usuario puede actualizar su propio documento (excepto rol)
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['rol']);
      
      // Solo admins pueden crear usuarios
      allow create: if request.auth != null 
        && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol in ['admin', 'super_admin'];
      
      // Solo super_admins pueden cambiar roles
      match /usuarios/{userId} {
        allow update: if request.auth != null 
          && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'super_admin';
      }
    }
  }
}
```

### Índices necesarios:

1. **auth_id** (ascending) - Para búsquedas por auth_id
2. **email** (ascending) - Para búsquedas por email
3. **conjunto_id** (ascending) - Para búsquedas por conjunto

### Cómo crear los índices:

1. Ve a Firebase Console > Firestore Database > Indexes
2. Haz clic en "Create Index"
3. Selecciona la colección "usuarios"
4. Agrega los campos necesarios según las consultas que uses

