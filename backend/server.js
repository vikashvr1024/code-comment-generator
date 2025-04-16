const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

// Initialize Gemini AI with error handling
let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('Successfully initialized Gemini AI');
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error);
  process.exit(1);
}

// Language-specific comment syntax
const commentSyntax = {
  python: '#',
  javascript: '//',
  java: '//',
  cpp: '//',
  csharp: '//',
  php: '//',
  ruby: '#',
  go: '//',
  swift: '//',
  rust: '//',
  general: '//'
};

// Function to generate comments using Gemini AI
async function generateComments(code, language) {
  try {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid code input');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const commentChar = commentSyntax[language] || '//';
    
    const prompt = `You are a code documentation expert. Please analyze this ${language} code and generate clear, concise comments explaining each line or logical block. Use ${commentChar} for single-line comments.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Requirements:
1. Use ${commentChar} for comments
2. Place comments ABOVE the code they describe
3. Explain the purpose and logic of:
   - Functions and methods
   - Classes and data structures
   - Control flow statements
   - Complex algorithms
   - Important variable declarations
4. Keep comments concise but informative
5. Maintain the original code structure exactly
6. Focus on explaining the "why" not just the "what"
7. Use proper technical terminology for ${language}

Return only the commented code without any additional text or markdown formatting.`;

    console.log('Sending request to Gemini AI...');
    const result = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });
    
    if (!result || !result.response) {
      throw new Error('Empty response from Gemini AI');
    }
    
    const response = await result.response;
    console.log('Successfully generated comments');
    return response.text().trim();
  } catch (error) {
    console.error('Error in generateComments:', error);
    throw new Error(`Failed to generate comments: ${error.message}`);
  }
}

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{
        parts: [{ text: "Hello, are you working?" }]
      }]
    });
    
    res.json({ 
      message: 'Backend server is running',
      status: 'API initialized successfully',
      test_response: result.response.text()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'API initialization failed',
      details: error.message
    });
  }
});

// API endpoint to generate comments
app.post('/api/generate-comments', async (req, res) => {
  try {
    const { code, language = 'general' } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        error: 'Code is required',
        details: 'Please provide code to generate comments'
      });
    }

    console.log(`Processing request for ${language} code`);
    const commentedCode = await generateComments(code, language);
    
    if (!commentedCode) {
      throw new Error('No comments generated');
    }

    res.json({ commentedCode });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Failed to generate comments',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'not set');
}); 