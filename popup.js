document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-btn');
    
    startBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: createFloatingPopup
            });
            window.close();
        });
    });
});

function createFloatingPopup() {
    // This function will be injected into the page
    if (document.getElementById('ai-extractor-popup')) {
        return; // Popup already exists
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
    
    // Add the CSS styles
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
    
    // Make popup draggable
    makeDraggable(popup);
    
    // Initialize popup functionality
    initializePopupFunctionality();
}
