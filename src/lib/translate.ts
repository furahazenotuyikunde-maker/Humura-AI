const LIBRE_TRANSLATE_URL = 'https://libretranslate-production-06e3.up.railway.app/translate';

export async function translateText(text: string, target: 'rw' | 'en'): Promise<string> {
  if (!text) return '';
  
  try {
    const source = target === 'rw' ? 'en' : 'rw';
    
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
        format: 'text',
        api_key: ''
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Translation API failed');
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}
