// ============================================================
// run-seed.js
// Script de seed usando Node.js + driver de MongoDB
// Ejecutar con: node run-seed.js
// ============================================================

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');

// Configuración
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'plataforma_virtual';

// Cargar todos los módulos de seed
const objectIds = require('./00-object-ids');
const institutionalSettings = require('./01-institutional-settings');
const users = require('./02-users');
const fileMetadata = require('./03-file-metadata');
const courses = require('./04-courses');
const tasks = require('./05-tasks');
const taskSubmissions = require('./06-task-submissions');
const attendanceRegisters = require('./07-attendance-registers');
const auditEntries = require('./08-audit-entries');

async function runSeed() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('🌱 Conectado a MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Limpiar base de datos
    console.log(' Limpiando base de datos...');
    await db.dropDatabase();
    console.log('✅ Base de datos limpiada');
    
    // Paso 1: Configuración institucional
    console.log(' Paso 1/8: Configuración institucional...');
    await db.collection('institutional_settings').insertOne(institutionalSettings.data);
    console.log('✅ Configuración institucional creada');
    
    // Paso 2: Usuarios
    console.log(' Paso 2/8: Usuarios...');
    const usersData = users.data.map(u => ({
      ...u,
      password: bcrypt.hashSync('demo123', 10)
    }));
    await db.collection('users').insertMany(usersData);
    console.log(`✅ ${usersData.length} usuarios creados`);
    
    // Paso 3: Metadatos de archivos
    console.log('📦 Paso 3/8: Metadatos de archivos...');
    await db.collection('file_metadata').insertMany(fileMetadata.data);
    console.log(`✅ ${fileMetadata.data.length} archivos creados`);
    
    // Paso 4: Cursos
    console.log('📦 Paso 4/8: Cursos...');
    await db.collection('courses').insertMany(courses.data);
    console.log(`✅ ${courses.data.length} cursos creados`);
    
    // Paso 5: Tareas
    console.log('📦 Paso 5/8: Tareas...');
    await db.collection('tasks').insertMany(tasks.data);
    console.log(`✅ ${tasks.data.length} tareas creadas`);
    
    // Paso 6: Entregas de tareas
    console.log('📦 Paso 6/8: Entregas de tareas...');
    await db.collection('task_submissions').insertMany(taskSubmissions.data);
    console.log(`✅ ${taskSubmissions.data.length} entregas creadas`);
    
    // Paso 7: Registros de asistencia
    console.log('📦 Paso 7/8: Registros de asistencia...');
    await db.collection('attendance_registers').insertMany(attendanceRegisters.data);
    console.log(`✅ ${attendanceRegisters.data.length} registros creados`);
    
    // Paso 8: Entradas de auditoría
    console.log('📦 Paso 8/8: Entradas de auditoría...');
    await db.collection('audit_entries').insertMany(auditEntries.data);
    console.log(`✅ ${auditEntries.data.length} entradas creadas`);
    
    // Validación
    console.log('\n🔍 Validación de datos...');
    const collections = [
      { name: 'institutional_settings', expected: 1 },
      { name: 'users', expected: 11 },
      { name: 'file_metadata', expected: 12 },
      { name: 'courses', expected: 3 },
      { name: 'tasks', expected: 3 },
      { name: 'task_submissions', expected: 3 },
      { name: 'attendance_registers', expected: 3 },
      { name: 'audit_entries', expected: 15 }
    ];
    
    let allOk = true;
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      const status = count === col.expected ? '✅' : '❌';
      if (count !== col.expected) allOk = false;
      console.log(`  ${status} ${col.name}: ${count} documentos (esperado: ${col.expected})`);
    }
    
    if (allOk) {
      console.log('\n🎉 ¡SEED DATA COMPLETADO EXITOSAMENTE!');
      console.log('\n📊 Resumen:');
      console.log('  • 1 configuración institucional');
      console.log('  • 11 usuarios (2 admins, 3 docentes, 6 estudiantes)');
      console.log('  • 12 archivos (7 materiales, 3 entregas, 1 logo, 1 institucional)');
      console.log('  • 3 cursos con semanas, sesiones y materiales');
      console.log('  • 3 tareas (1 futura, 1 pasada, 1 sin límite)');
      console.log('  • 3 entregas (1 a tiempo, 1 tardía, 1 revisada)');
      console.log('  • 3 registros de asistencia (6 fechas total)');
      console.log('  • 15 entradas de auditoría');
      console.log('\n🔑 Contraseña para TODOS los usuarios: demo123');
      console.log('📧 Login: usar institutionalEmail de cada usuario');
    } else {
      console.log('\n❌ ADVERTENCIA: Algunas validaciones fallaron. Revisa los datos.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

runSeed();
