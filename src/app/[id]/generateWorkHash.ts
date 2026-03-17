import CryptoJS from 'crypto-js';

export function generateWorkHash(
  title: string,
  creator_id: string,
  timestamp: number,
  fileContent?: string
) {
  // Crear un string único con todos los datos de la obra
  const dataToHash = [
    title,
    creator_id,
    timestamp.toString(),
    fileContent || '' // Si hay contenido del archivo, se incluye
  ].join('|');

  // Generar SHA-256 hash
  const hash = CryptoJS.SHA256(dataToHash).toString();
  
  // Tomar los primeros 16 caracteres para un ID manejable
  return 'HASH-' + hash.substring(0, 16).toUpperCase();
}