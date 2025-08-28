let screenshots = [];
let isCapturing = false;

function createFloatingPopup() {
    if (document.getElementById('ai-extractor-popup')) {
        return;
    }
    
    const popup = document.createElement('div');
    popup.id = 'ai-extractor-popup';
    popup.innerHTML = `
        <div class="answer-area">Ready</div>
        <div class="button-grid">
            <button class="mini-btn" id="capture-btn">Capture</button>
            <button class="mini-btn" id="start-btn">Start</button>
            <button class="mini-btn" id="test-btn">Test</button>
            <button class="mini-btn close-btn" id="close-btn">Close</button>
        </div>
    `;
    
    const style = document.createElement('style');
    style.setAttribute('data-extension', 'ai-extractor');
    style.textContent = `
        #ai-extractor-popup {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 220px !important;
            background: rgba(0, 0, 0, 0.85) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 6px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
            z-index: 999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            padding: 12px !important;
            cursor: grab !important;
        }

        #ai-extractor-popup:active {
            cursor: grabbing !important;
        }

        .answer-area {
            background: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 4px !important;
            padding: 12px !important;
            margin-bottom: 10px !important;
            color: white !important;
            font-size: 13px !important;
            font-weight: 400 !important;
            text-align: center !important;
            min-height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1.3 !important;
            cursor: grab !important;
        }

        .button-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
        }

        .mini-btn {
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 4px !important;
            color: white !important;
            font-size: 11px !important;
            font-weight: 500 !important;
            padding: 8px 6px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            text-align: center !important;
        }

        .mini-btn:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            border-color: rgba(255, 255, 255, 0.25) !important;
            transform: translate(-1px, -1px) !important;
        }

        .mini-btn:active {
            transform: translate(0, 0) !important;
            background: rgba(255, 255, 255, 0.1) !important;
        }

        .close-btn {
            grid-column: span 2 !important;
            background: rgba(255, 255, 255, 0.04) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .close-btn:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
        }

        #ai-extractor-popup * {
            box-sizing: border-box !important;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(popup);
    
    makeDraggable(popup);
    initializePopupFunctionality();
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    const answerArea = element.querySelector('.answer-area');
    answerArea.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        isDragging = true;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        
        element.style.cursor = 'grabbing';
        answerArea.style.cursor = 'grabbing';
    }
    
    function elementDrag(e) {
        if (!isDragging) return;
        
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        const newTop = element.offsetTop - pos2;
        const newLeft = element.offsetLeft - pos1;
        
        const maxTop = window.innerHeight - element.offsetHeight;
        const maxLeft = window.innerWidth - element.offsetWidth;
        
        element.style.top = Math.max(0, Math.min(newTop, maxTop)) + "px";
        element.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + "px";
    }
    
    function closeDragElement() {
        isDragging = false;
        document.onmouseup = null;
        document.onmousemove = null;
        
        element.style.cursor = 'grab';
        answerArea.style.cursor = 'grab';
    }
}

function initializePopupFunctionality() {
    const answerArea = document.querySelector('.answer-area');
    const captureBtn = document.getElementById('capture-btn');
    const startBtn = document.getElementById('start-btn');
    const testBtn = document.getElementById('test-btn');
    const closeBtn = document.getElementById('close-btn');
    
    captureBtn.addEventListener('click', captureScreenshot);
    startBtn.addEventListener('click', processScreenshots);
    testBtn.addEventListener('click', testServer);
    closeBtn.addEventListener('click', closePopup);
    
    function updateStatus(status) {
        answerArea.textContent = status;
    }
    
    function captureScreenshot() {
        if (isCapturing) return;
        
        isCapturing = true;
        updateStatus('Capturing...');
        
        chrome.runtime.sendMessage({
            action: 'captureScreenshot'
        }, function(response) {
            if (response && response.success) {
                screenshots.push(response.dataUrl);
                updateStatus(`Captured ${screenshots.length} screenshot${screenshots.length > 1 ? 's' : ''}`);
            } else {
                updateStatus('Capture failed');
            }
            isCapturing = false;
        });
    }
    
    async function processScreenshots() {
        if (screenshots.length === 0) {
            updateStatus('No screenshots to process');
            return;
        }
        
        updateStatus('Processing...');
        
        try {
            const response = await fetch('http://localhost:3000/api/process-mcq', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    screenshots: screenshots
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Server error');
            }
            
            const result = await response.json();
            
            updateStatus('Saving...');
            
            if (result.answers && result.answers.length > 0) {
                let answerText = '';
                result.answers.forEach((answer, index) => {
                    answerText += `${index + 1}.${answer} `;
                });
                updateStatus(`Answers: ${answerText.trim()}`);
            } else {
                updateStatus('No answers found');
            }
            
            screenshots = [];
            
        } catch (error) {
            updateStatus('Processing failed: ' + error.message);
            console.error('Error:', error);
        }
    }
    
    function testServer() {
        updateStatus('Testing server...');
        
        fetch('http://localhost:3000/api/test')
            .then(response => response.json())
            .then(data => {
                updateStatus('Server OK - Opening dashboard');
                window.open('http://localhost:3000', '_blank');
                setTimeout(() => {
                    updateStatus('Ready');
                }, 2000);
            })
            .catch(error => {
                updateStatus('Server offline');
                console.error('Server test failed:', error);
            });
    }
    
    function closePopup() {
        const popup = document.getElementById('ai-extractor-popup');
        if (popup) {
            popup.remove();
        }
        const style = document.querySelector('style[data-extension="ai-extractor"]');
        if (style) {
            style.remove();
        }
        screenshots = [];
    }
}
