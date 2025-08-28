const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyDXMQKNaQtKx2lBZAcpHplCxW2H-la6EAA');

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// Store for extracted data
let extractedData = [];

// Helper function to convert base64 to buffer for Gemini
function base64ToBuffer(base64String) {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

// Helper function to clean Gemini response and extract JSON
function cleanGeminiResponse(responseText) {
    console.log('Raw Gemini response:', responseText);
    
    // Remove markdown code blocks if present
    let cleaned = responseText.trim();
    
    // Remove ```json or ``` at the beginning
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
    }
    
    // Remove ``` at the end
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    // Trim whitespace
    cleaned = cleaned.trim();
    
    console.log('Cleaned response:', cleaned);
    return cleaned;
}

// API Routes
app.get('/api/test', (req, res) => {
    res.json({
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        geminiConnected: true
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
            console.error('Cleaned text that failed to parse:', cleanedText);
            
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
        
        // Extract answers in the requested format (just the answer text, not the letter)
        const answers = extractedContent.questions.map(q => {
            if (q.correct_option) {
                // Extract just the answer text after the letter and parenthesis
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
            aiProvider: 'Gemini'
        };
        
        extractedData.push(extractedMCQ);
        
        console.log(`Successfully processed ${extractedContent.questions.length} questions`);
        console.log('Extracted answers:', answers);
        
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

// Clear data endpoint
app.post('/api/clear', (req, res) => {
    extractedData = [];
    res.json({success: true, message: 'Data cleared'});
});

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Dashboard available at http://localhost:${PORT}`);
    console.log('Gemini AI integration ready');
});
