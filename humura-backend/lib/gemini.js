const axios = require('axios');

/**
 * Call Gemini 2.5 Flash via Google AI Studio REST API
 * No SDKs used as per specification.
 */
async function callGemini(prompt) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    return res.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini Helper Error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = { callGemini };
