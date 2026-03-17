export function generateWorkHash(
  title: string,
  creator_id: string,
  timestamp: number,
  extraData: string = ''
): string {
  
  const dataToHash = [
    title.trim().toLowerCase(),
    creator_id.trim(),
    timestamp.toString(),
    extraData.trim().substring(0, 100)
  ].join('|');

  let hash = 0;
  for (let i = 0; i < dataToHash.length; i++) {
    const char = dataToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const hashHex = Math.abs(hash).toString(16).toUpperCase();
  return 'WORK-' + hashHex.padStart(10, '0').substring(0, 10);
}