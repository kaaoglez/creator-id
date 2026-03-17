const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

// Leer .env.local manualmente
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parsear variables
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('📁 Variables encontradas:', Object.keys(envVars));
console.log('🔑 RESEND_API_KEY presente:', !!envVars.RESEND_API_KEY);
console.log('🔑 Primeros caracteres:', envVars.RESEND_API_KEY ? envVars.RESEND_API_KEY.substring(0, 5) + '...' : 'no encontrada');

if (!envVars.RESEND_API_KEY) {
  console.error('❌ No se encontró RESEND_API_KEY en .env.local');
  process.exit(1);
}

const resend = new Resend(envVars.RESEND_API_KEY);

async function testEmail() {
  console.log('\n📧 Enviando email de prueba...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Creator ID <onboarding@resend.dev>',
      to: ['osmancastillero@gmail.com'],
      subject: 'Test desde Creator ID',
      html: '<h1>Email de prueba</h1><p>Funciona correctamente ✅</p>'
    });
    
    if (error) {
      console.error('❌ Error de Resend:', error);
    } else {
      console.log('✅ Enviado correctamente:', data);
    }
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testEmail();