# Reference to Context Solver

A Chrome extension that captures multiple screenshots of comprehension questions with MCQs and extracts answers using AI processing.

## Features

- **Minimal Design**: Clean black/white interface with small, draggable popup
- **Multiple Screenshot Capture**: Capture multiple screenshots of comprehension passages and MCQs
- **AI Processing**: Process screenshots to extract answers in the format: 1.answer1 2.answer2 3.answer3...
- **Draggable Popup**: Floating popup that can be moved anywhere on the screen
- **Real-time Status Updates**: Shows current status (Ready → Capturing → Processing → Saving → Answers)
- **Dashboard**: Web interface to review extracted data and answers
- **Server Integration**: Backend processing with Node.js/Express

## File Structure

```
Reference-to-Context-Solver/
├── manifest.json          # Extension manifest
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Content script for floating popup
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── server/               # Backend server
│   ├── package.json      # Node.js dependencies
│   ├── server.js         # Express server
│   └── public/
│       └── dashboard.html # Data dashboard
└── README.md             # This file
```

## Installation

### 1. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder (containing `manifest.json`)
5. The "Reference to Context Solver" extension should now appear

### 2. Setup Backend Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. The server will run on `http://localhost:3000`

## Usage

### Basic Workflow

1. **Start Extension**: Click the extension icon in Chrome toolbar
2. **Activate**: Click "Start" button to show the floating popup
3. **Capture Screenshots**: 
   - Navigate to a webpage with comprehension questions
   - Click "Capture" button multiple times to capture:
     - Comprehension passage
     - Question 1
     - Question 2
     - Question 3
     - etc.
4. **Process**: Click "Start" button to process all screenshots
5. **View Results**: Answers will be displayed in the popup status

### Floating Popup Controls

- **Capture**: Takes a screenshot of the current visible area
- **Start**: Processes all captured screenshots and extracts answers
- **Test**: Tests server connection and opens dashboard
- **Close**: Removes the floating popup
- **Drag**: Click and drag the popup to move it anywhere on screen

### Dashboard

- Access via `http://localhost:3000` or click "Test" button
- View all extracted MCQ sessions
- See timestamps and screenshot counts
- Review extracted answers

## API Endpoints

- `GET /api/test` - Test server connectivity
- `POST /api/process-mcq` - Process screenshots and extract answers
- `GET /api/data` - Retrieve all extracted data
- `GET /` - Dashboard interface

## Customization

### Adding AI Integration

To integrate with actual AI services (Gemini, Perplexity, etc.), modify the `processScreenshots` function in `server/server.js`:

```javascript
// Replace the mock response with actual AI API calls
const aiResponse = await callAIService(screenshots);
const extractedAnswers = aiResponse.answers;
```

### Modifying Answer Format

The current format displays answers as `1.answer1 2.answer2 3.answer3`. To change this, modify the answer display logic in `content.js`:

```javascript
// Customize answer format here
let answerText = 'Custom Format: ';
result.answers.forEach((answer, index) => {
    answerText += `Q${index + 1}: ${answer} | `;
});
```

## Troubleshooting

### Extension Not Working
- Check if Developer mode is enabled
- Verify all files are in the correct directory structure
- Check Chrome console for errors

### Server Connection Issues
- Ensure Node.js is installed
- Verify server is running on port 3000
- Check firewall settings
- Use "Test" button to verify connectivity

### Screenshot Capture Fails
- Check extension permissions
- Ensure you're on a supported webpage
- Try refreshing the page and restarting the extension

## Development

### Adding New Features
- Modify `content.js` for frontend functionality
- Update `server.js` for backend API changes
- Edit `popup.css` for styling modifications

### Testing Changes
- Reload extension in Chrome extensions page
- Restart server after backend changes
- Use browser developer tools for debugging

## Requirements

- Google Chrome browser
- Node.js (for server)
- npm (for dependencies)

## Dependencies

### Extension
- Chrome Extensions Manifest V3
- No external dependencies

### Server
- Express.js
- CORS middleware
- Body-parser
- Multer (for file handling)

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Chrome console for error messages
3. Verify server logs for backend issues
4. Check extension permissions and settings

---

**Note**: This extension currently uses mock data for demonstration. To use with real AI services, integrate your preferred AI API in the server code.
