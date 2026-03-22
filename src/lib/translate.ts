// src/lib/translate.ts

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || text.trim() === '') return ''
  
  // Si el idioma es español, no traducir
  if (targetLang === 'es') return text
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    const response = await fetch(url)
    const data = await response.json()
    
    // La respuesta de Google Translate es un array anidado
    if (data && data[0]) {
      return data[0].map((item: any) => item[0]).join('')
    }
    return text
  } catch (error) {
    console.error('Error translating:', error)
    return text
  }
}

// Función para traducir arrays de textos (ej: lista de obras)
export async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  return Promise.all(texts.map(text => translateText(text, targetLang)))
}