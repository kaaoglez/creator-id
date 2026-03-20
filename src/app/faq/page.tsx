'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

// Componente para botones interactivos en las respuestas
const ActionButton = ({ href, text, icon }: { href: string; text: string; icon: string }) => (
  <Link
    href={href}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      marginTop: '12px',
      background: 'linear-gradient(135deg, #4f46e5, #10b981)',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      transition: 'all 0.2s',
      border: 'none',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <span>{icon}</span>
    {text}
  </Link>
)

// Componente para renderizar respuestas con botones
const FormattedAnswer = ({ answer }: { answer: string }) => {
  // Detectar si la respuesta contiene marcadores de acción
  if (answer.includes('[ACTION:')) {
    const parts = answer.split(/(\[ACTION:[^\]]+\])/g)
    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
        {parts.map((part, index) => {
          const actionMatch = part.match(/\[ACTION:([^|]+)\|([^|]+)\|([^\]]+)\]/)
          if (actionMatch) {
            const [_, href, text, icon] = actionMatch
            return <ActionButton key={index} href={href} text={text} icon={icon} />
          }
          return <span key={index}>{part}</span>
        })}
      </div>
    )
  }
  return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{answer}</div>
}

// Base de conocimiento con respuestas interactivas
const knowledgeBase = {
  // Preguntas sobre registro y cuenta
  account: [
    { keywords: ['crear cuenta', 'registrarse', 'como empiezo', 'primeros pasos', 'registro'], 
      answer: '📝 Para crear tu cuenta en Creator-ID:\n\n1. Haz clic en el botón de abajo para ir al registro\n2. Completa tu email y contraseña\n3. Luego completa tu información personal (nombre y país)\n4. ¡Listo! Recibirás tu Creator ID único automáticamente\n\nEs completamente gratuito y no requiere tarjeta de crédito.\n\n[ACTION:/register|Crear mi cuenta ahora|🚀]' },
    
    { keywords: ['creator id', 'que es el id', 'identificador', 'id unico'], 
      answer: '🆔 El Creator ID es tu identificador único en la plataforma.\n\n• Se genera automáticamente al registrarte\n• Formato: "124-7BNHBEK"\n• Comparte tu perfil público: creator-id.com/tu-id\n• Lo usas para registrar tus obras\n\n[ACTION:/profile|Ver mi perfil|👤]' },
    
    { keywords: ['editar perfil', 'cambiar nombre', 'cambiar email', 'actualizar perfil', 'foto'], 
      answer: '✏️ Puedes editar tu perfil cuando quieras:\n\n• Cambiar nombre público\n• Actualizar email\n• Añadir teléfono\n• Cambiar región\n• Subir foto de avatar\n• Añadir biografía\n\n[ACTION:/profile/edit|Ir a editar perfil|✏️]' },
    
    { keywords: ['eliminar cuenta', 'borrar cuenta', 'darme de baja', 'eliminar perfil'], 
      answer: '⚠️ Para eliminar tu cuenta permanentemente:\n\nEsta acción es IRREVERSIBLE. Se eliminarán:\n• Todas tus obras\n• Mensajes\n• Estadísticas\n• Datos personales\n\n[ACTION:/profile|Ir a mi perfil|🗑️]\n\n⚠️ Una vez en tu perfil, busca la sección "Zona de peligro".' }
  ],

  // Preguntas sobre obras
  works: [
    { keywords: ['registrar obra', 'subir obra', 'publicar obra', 'nueva obra'], 
      answer: '🖼️ Para registrar una obra:\n\n1. Ve a tu perfil\n2. Haz clic en "Registrar nueva obra"\n3. Completa:\n   • Título (obligatorio)\n   • Descripción\n   • Precio (opcional)\n4. Sube tu archivo\n5. ¡Listo! Se generará un hash único\n\n[ACTION:/works/new|Registrar nueva obra|➕]' },
    
    { keywords: ['precio', 'vender', 'cuanto cuesta', 'royalty', 'comision', 'ganancias'], 
      answer: '💰 Sistema de ventas:\n\n• Tú eliges el precio de cada obra\n• En cada venta, tú recibes el 75%\n• La plataforma recibe el 25%\n\nEjemplo: Vendes a $100 → recibes $75\n\n[ACTION:/works/new|Registrar obra con precio|💵]' },
    
    { keywords: ['hash', 'verificacion', 'autenticidad', 'codigo unico'], 
      answer: '🔐 El hash es tu firma digital:\n\n• Código único por obra\n• Prueba de autenticidad\n• Fecha de registro verificable\n• Cualquiera puede verificar\n\n[ACTION:/verify|Verificar una obra|✅]' },
    
    { keywords: ['editar obra', 'modificar obra', 'cambiar obra'], 
      answer: '✏️ Actualmente no puedes editar una obra después de registrada.\n\nAlternativa:\n1. Elimina la obra existente\n2. Regístrala de nuevo con la información corregida\n\n⚠️ El hash será diferente (nueva fecha de registro).\n\n[ACTION:/profile|Ir a mis obras|📚]' },
    
    { keywords: ['eliminar obra', 'borrar obra'], 
      answer: '🗑️ Para eliminar una obra:\n\n1. Ve a "Mi Perfil"\n2. Encuentra la obra en tu lista\n3. Haz clic en el botón "Eliminar" (ícono papelera)\n4. Confirma la eliminación\n\n⚠️ La obra se eliminará permanentemente.\n\n[ACTION:/profile|Ir a mi perfil|👤]' }
  ],

  // Preguntas sobre comunicación
  communication: [
    { keywords: ['contactar creador', 'mensaje', 'escribir a creador', 'contactar'], 
      answer: '💬 Para contactar a un creador:\n\n1. Ve a su perfil público\n2. Haz clic en "Contactar creador"\n3. Completa tu nombre, email y mensaje\n4. Envía\n\nTambién puedes contactar desde la Tienda.\n\n[ACTION:/shop|Explorar tienda|🛍️]' },
    
    { keywords: ['mensajes', 'bandeja', 'responder', 'leer mensajes'], 
      answer: '📬 Para ver tus mensajes:\n\n• Los mensajes nuevos aparecen destacados\n• Puedes marcarlos como leídos\n• También puedes eliminarlos\n\n[ACTION:/messages|Ver mis mensajes|📬]' }
  ],

  // Preguntas sobre estadísticas
  stats: [
    { keywords: ['visitas', 'estadisticas', 'cuantas personas', 'vistas'], 
      answer: '📊 Estadísticas en tiempo real:\n\n• Visitas a tu perfil público\n• Visitas a cada obra\n• Mensajes recibidos\n• Ventas realizadas\n\nTodo se actualiza automáticamente.\n\n[ACTION:/profile|Ver mis estadísticas|📈]' }
  ],

  // Preguntas sobre tienda
  shop: [
    { keywords: ['tienda', 'comprar', 'adquirir obra', 'comprar obra'], 
      answer: '🛍️ La Tienda es tu vitrina:\n\n• Explora todas las obras\n• Ver detalles de cada obra\n• Contactar al creador\n• Próximamente: compra directa\n\n[ACTION:/shop|Visitar la tienda|🛍️]' }
  ],

  // Preguntas sobre precios
  pricing: [
    { keywords: ['costo', 'gratis', 'precio plataforma', 'pagar'], 
      answer: '💰 Costos:\n\n• Registro: GRATUITO\n• Perfil: GRATUITO\n• Registrar obras: GRATUITO\n• Estadísticas: GRATUITAS\n\nSOLO pagas cuando vendes: 25% comisión\n\n[ACTION:/works/new|Registrar obra gratis|🎨]' }
  ]
}

export default function FAQPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '🎨 ¡Hola! Soy tu asistente virtual de Creator-ID. ¿En qué puedo ayudarte?\n\nPuedo responderte sobre:\n\n📝 • Registro y cuenta\n🖼️ • Registrar obras\n💰 • Precios y royalty (75% para ti)\n🔐 • Hash de verificación\n✏️ • Editar perfil\n🗑️ • Eliminar cuenta\n💬 • Contactar creadores\n📊 • Estadísticas\n🛍️ • Tienda\n\n¿Qué te gustaría saber? También puedo darte enlaces directos a las secciones que necesites.' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase()
    
    const allFaqs = [
      ...knowledgeBase.account,
      ...knowledgeBase.works,
      ...knowledgeBase.communication,
      ...knowledgeBase.stats,
      ...knowledgeBase.shop,
      ...knowledgeBase.pricing
    ]
    
    for (const faq of allFaqs) {
      if (faq.keywords.some(keyword => lowerQuestion.includes(keyword))) {
        return faq.answer
      }
    }
    
    return 'No tengo información específica sobre eso. ¿Puedes preguntarme sobre:\n\n• Registro y cuenta\n• Registrar obras\n• Precios y royalty (75%)\n• Hash de verificación\n• Editar perfil\n• Eliminar cuenta\n• Contactar creadores\n• Estadísticas\n• Tienda\n\nO prueba con los botones de sugerencias abajo. 👇'
  }

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setIsTyping(true)
    
    setTimeout(() => {
      const answer = findAnswer(userMessage)
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
      setIsTyping(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <div style={{ 
      maxWidth: "900px", 
      margin: "40px auto", 
      padding: "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #4f46e5, #10b981)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          🤖
        </div>
        <h1 style={{ 
          fontSize: "2rem", 
          margin: 0,
          background: "linear-gradient(135deg, #4f46e5, #10b981)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Asistente Virtual
        </h1>
      </div>
      
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Pregúntame cualquier cosa sobre Creator-ID. Te daré respuestas con enlaces directos.
      </p>

      {/* Chat Container */}
      <div style={{
        background: 'white',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '550px'
      }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          background: '#fafafa'
        }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '16px'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: msg.role === 'user' ? '#4f46e5' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                border: msg.role === 'assistant' ? '1px solid #eaeaea' : 'none'
              }}>
                <FormattedAnswer answer={msg.content} />
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'white',
                border: '1px solid #eaeaea',
                display: 'flex',
                gap: '4px'
              }}>
                <span style={{ animation: 'blink 1.4s infinite' }}>●</span>
                <span style={{ animation: 'blink 1.4s infinite 0.2s' }}>●</span>
                <span style={{ animation: 'blink 1.4s infinite 0.4s' }}>●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias */}
        <div style={{
          padding: '12px 20px',
          background: 'white',
          borderTop: '1px solid #eaeaea',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {['¿Cómo me registro?', '¿Cuánto gano por venta?', '¿Qué es el hash?', '¿Cómo contacto a un creador?', '¿Cómo elimino mi cuenta?', '¿Qué estadísticas hay?', '¿Cómo registro una obra?'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestion(suggestion)}
              style={{
                padding: '6px 12px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '20px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: '#4f46e5'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 20px',
          background: 'white',
          borderTop: '1px solid #eaeaea',
          display: 'flex',
          gap: '12px'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: '12px 24px',
              background: input.trim() ? 'linear-gradient(135deg, #4f46e5, #10b981)' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Info adicional */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#f0f7ff',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          💡 <strong>Consejo:</strong> Haz clic en los botones que aparecen en las respuestas para ir directamente a las secciones.
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}