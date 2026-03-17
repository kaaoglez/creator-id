const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const match = envContent.match(/RESEND_API_KEY=(.+)/);
if (!match) {
  console.error('❌ No se encontró RESEND_API_KEY en .env.local');
  process.exit(1);
}

const RESEND_API_KEY = match[1].trim();
console.log('🔑 API Key encontrada:', RESEND_API_KEY.substring(0, 5) + '...');

async function testEmail() {
  console.log('\n📧 Enviando email con fetch...');
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer \,
      },
      body: JSON.stringify({
        from: 'Creator ID <onboarding@resend.dev>',
        to: ['osmancastillero@gmail.com'],
        subject: 'Test con fetch',
        html: '<p>Email de prueba con fetch</p>',
      }),
    });

    const data = await response.json();
    console.log('📊 Status:', response.status);
    console.log('📦 Respuesta:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Email enviado correctamente');
    } else {
      console.log('❌ Error al enviar');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
