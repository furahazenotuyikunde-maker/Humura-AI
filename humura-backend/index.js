// Humura AI - Production Backend (Render Web Service)
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// 1. Setup Middleware
app.use(cors());

// 2. Setup Multer (Memory Storage for Multi-part Form Data)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit to prevent crashes
});

// 3. Initialize Gemini 3 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// 4. Image Analysis Endpoint
app.post('/analyze-sign', upload.single('image'), async (req, res) => {
  try {
    const { prompt, lang } = req.body;
    const isRw = lang?.startsWith('rw');

    // 🔍 GUARD: If multer finds no file
    if (!req.file) {
      console.error("[ERROR] No image file received in request.");
      return res.status(400).json({ 
        error: isRw ? "Ifasho ntishoboye kuboneka." : "No image received" 
      });
    }

    console.log(`[LOG] Processing image: ${req.file.size} bytes`);

    // Prepare image for Gemini
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype
      }
    };

    // 5. Call Gemini
    const result = await model.generateContent([
      prompt || "Analyze this sign language gesture empatheticly.", 
      imagePart
    ]);
    
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      success: true, 
      reply: text 
    });

  } catch (error) {
    console.error("[CRITICAL ERROR]", error);
    return res.status(500).json({ 
      error: error.message || "Failed to analyze image on the server." 
    });
  }
});

// 6. Health Check (for Render monitoring)
app.get('/', (req, res) => res.send('Humura AI Backend is Live!'));

app.listen(port, () => {
  console.log(`🚀 Humura AI Backend listening at http://localhost:${port}`);
});
