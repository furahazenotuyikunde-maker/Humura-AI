import glossary from './kinyarwanda_glossary.json';


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

  
  // Handle long texts by chunking (MyMemory has a 500-char limit for free tier)
  if (text.length > 450) {
    const chunks = text.match(/.{1,450}(\s|$)/g) || [];
    const translatedChunks = await Promise.all(
      chunks.map(chunk => translateText(chunk.trim(), target, source))
    );
    return translatedChunks.join(' ');
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${effectiveSource}|${target}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('MyMemory API failed');
    }

    const data = await response.json();
    
    // Check for API errors in response body
    if (data.responseStatus !== 200 && data.responseStatus !== "200") {
      console.warn("MyMemory API status error:", data.responseStatus, data.responseDetails);
      return text;
    }

    return data.responseData?.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

