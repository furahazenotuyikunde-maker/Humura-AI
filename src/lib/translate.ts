import glossary from './kinyarwanda_glossary.json';

const LIBRE_TRANSLATE_URL = 'https://translate.argosopentech.com/translate';

export async function translateText(text: string, target: 'rw' | 'en', source?: 'rw' | 'en'): Promise<string> {
  if (!text) return '';
  console.log(`Translating: "${text}" | From: ${source || 'auto'} | To: ${target}`);
  
  const normalizedText = text.toLowerCase().trim();
  const effectiveSource = source || (target === 'rw' ? 'en' : 'rw');

  // Skip if source and target are the same
  if (effectiveSource === target) {
    console.log("Source and target are the same, skipping API call.");
    return text;
  }

  if (target === 'rw') {
    // English -> Kinyarwanda lookup
    const entry = Object.entries(glossary).find(
      ([en]) => en.toLowerCase() === normalizedText
    );
    if (entry) return entry[1];
  } else {
    // Kinyarwanda -> English lookup (Reverse lookup)
    const entry = Object.entries(glossary).find(
      ([_, rw]) => rw.toLowerCase() === normalizedText
    );
    if (entry) return entry[0];
  }

  
  try {
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: effectiveSource,
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

