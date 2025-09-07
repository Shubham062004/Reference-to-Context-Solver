const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyDXMQKNaQtKx2lBZAcpHplCxW2H-la6EAA');

// Define allowed origins for CORS
const allowedOrigins = [
    'https://reference-to-context-solver.onrender.com',
    'http://localhost:3000', 
    'chrome-extension://*' // Allow Chrome extensions
];

// Base URL for API calls
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://reference-to-context-solver.onrender.com' 
    : 'http://localhost:3000';

// Enhanced CORS middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like curl, Postman, Chrome extensions)
        if (!origin) return callback(null, true);
        
        // Check if origin matches allowed origins or is a Chrome extension
        if (allowedOrigins.some(allowed => 
            origin === allowed || 
            (allowed.includes('*') && origin.startsWith('chrome-extension://'))
        )) {
            return callback(null, true);
        }
        
        console.log('CORS blocked origin:', origin);
        return callback(null, true); // Allow all for now, you can restrict later
    },
    credentials: true
}));

// Middleware
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// Store for extracted data
let extractedData = [];

// Helper function to convert base64 to buffer for Gemini
function base64ToBuffer(base64String) {
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

// Helper function to clean Gemini response and extract JSON
function cleanGeminiResponse(responseText) {
    console.log('Raw Gemini response length:', responseText.length);
    
    let cleaned = responseText.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
    }
    
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    cleaned = cleaned.trim();
    console.log('Cleaned response ready for parsing');
    return cleaned;
}

// API Routes
app.get('/api/test', (req, res) => {
    res.json({
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        geminiConnected: true,
        baseUrl: BASE_URL,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/base-url', (req, res) => {
    res.json({ 
        baseUrl: BASE_URL,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.post('/api/process-mcq', async (req, res) => {
    try {
        const {screenshots} = req.body;
        
        if (!screenshots || screenshots.length === 0) {
            return res.status(400).json({error: 'No screenshots provided'});
        }
        
        console.log(`Processing ${screenshots.length} screenshots with Gemini AI...`);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096,
            }
        });
        
        const prompt = `Extract from the given images the following information and return ONLY a valid JSON object without any markdown formatting or code blocks:

{
  "comprehension": "<full comprehension text if present, empty string if not>",
  "questions": [
    {
      "question": "<full question text>",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_option": "<the correct option letter and text, e.g., 'A) Option text'>"
    }
  ]
}

IMPORTANT RULES:
- Return ONLY pure JSON, no markdown formatting, no code blocks, no backticks
- Do NOT paraphrase or alter the text
- Reproduce all punctuation, case, and numbering exactly as visible
- If the correct answer is highlighted, marked, or labeled, use that as the correct_option
- If the answer cannot be determined, set correct_option to empty string
- If any text is unclear, set question to "Cannot extract", options to [], correct_option to ""
- Extract ALL questions visible across all images
- If there's a comprehension passage, include it exactly as shown
- For correct_option, include both the letter and the full text (e.g., "A) The correct answer text")

Return only the JSON object, nothing else.`;

        // Prepare images for Gemini
        const imageParts = screenshots.map(screenshot => {
            const buffer = base64ToBuffer(screenshot);
            return {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: 'image/png'
                }
            };
        });
        
        // Send to Gemini
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response to remove markdown formatting
        const cleanedText = cleanGeminiResponse(text);
        
        // Parse Gemini response
        let extractedContent;
        try {
            extractedContent = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse cleaned Gemini response:', parseError);
            
            // Fallback: try to extract JSON from the response manually
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    extractedContent = JSON.parse(jsonMatch[0]);
                    console.log('Successfully extracted JSON using regex');
                } catch (regexError) {
                    throw new Error('Could not parse AI response as valid JSON');
                }
            } else {
                throw new Error('No valid JSON found in AI response');
            }
        }
        
        // Validate the structure
        if (!extractedContent.questions || !Array.isArray(extractedContent.questions)) {
            throw new Error('Invalid response structure: missing questions array');
        }
        
        // Extract answers in the requested format
        const answers = extractedContent.questions.map(q => {
            if (q.correct_option) {
                const match = q.correct_option.match(/^[A-D]\)\s*(.+)$/);
                return match ? match[1] : q.correct_option;
            }
            return 'No answer found';
        });
        
        const extractedMCQ = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            comprehension: extractedContent.comprehension || '',
            questions: extractedContent.questions || [],
            answers: answers,
            screenshotCount: screenshots.length,
            aiProvider: 'Gemini',
            processedOn: BASE_URL
        };
        
        extractedData.push(extractedMCQ);
        
        console.log(`Successfully processed ${extractedContent.questions.length} questions`);
        
        res.json({
            success: true,
            answers: answers,
            data: extractedMCQ
        });
        
    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({
            error: 'Processing failed',
            details: error.message
        });
    }
});

app.get('/api/data', (req, res) => {
    res.json(extractedData);
});

app.post('/api/clear', (req, res) => {
    extractedData = [];
    res.json({success: true, message: 'Data cleared'});
});

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Dashboard available at ${BASE_URL}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Gemini AI integration ready');
});
