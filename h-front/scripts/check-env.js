#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Uso: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Verificar si existe .env.local
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró el archivo .env.local');
  console.log('💡 Crea el archivo copiando desde .env.example:');
  console.log('   cp .env.example .env.local\n');
  process.exit(1);
}

// Leer .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

// Variables requeridas
const requiredVars = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'API Key de Firebase (obtén desde Firebase Console)',
  'NEXT_PUBLIC_FIREBASE_APP_ID': 'App ID de Firebase (obtén desde Firebase Console)',
  'NEXT_PUBLIC_API_URL': 'URL del backend API',
};

const missingVars = [];
const invalidVars = [];

// Verificar cada variable requerida
for (const [varName, description] of Object.entries(requiredVars)) {
  const line = envLines.find(l => l.startsWith(varName + '='));
  
  if (!line) {
    missingVars.push({ name: varName, description });
  } else {
    const value = line.split('=')[1]?.trim();
    if (!value || value.includes('REEMPLAZA') || value === '...' || value === 'tu_api_key' || value === 'tu_app_id') {
      invalidVars.push({ name: varName, description, value });
    }
  }
}

// Mostrar resultados
if (missingVars.length === 0 && invalidVars.length === 0) {
  console.log('✅ Todas las variables de entorno están configuradas correctamente!\n');
  process.exit(0);
}

if (missingVars.length > 0) {
  console.error('❌ Variables faltantes:\n');
  missingVars.forEach(({ name, description }) => {
    console.error(`   - ${name}`);
    console.error(`     ${description}\n`);
  });
}

if (invalidVars.length > 0) {
  console.error('⚠️  Variables con valores placeholder (necesitas reemplazarlos):\n');
  invalidVars.forEach(({ name, description, value }) => {
    console.error(`   - ${name}`);
    console.error(`     Valor actual: ${value}`);
    console.error(`     ${description}\n`);
  });
}

console.log('\n📖 Para obtener la API Key y App ID de Firebase:');
console.log('   1. Ve a: https://console.firebase.google.com/project/housing-complex-ff56c/settings/general');
console.log('   2. En "Your apps", busca tu app web o créala');
console.log('   3. Copia los valores de "apiKey" y "appId" del objeto firebaseConfig');
console.log('   4. Actualiza tu archivo .env.local con estos valores');
console.log('\n📝 Ver guía completa: COMO_OBTENER_API_KEY.md\n');

process.exit(1);

