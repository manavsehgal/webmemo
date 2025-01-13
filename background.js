import { initializeAnthropicClient, processChatMessage, processWithClaude } from './anthropic-api.js';

// Function to sanitize text for JSON
function sanitizeForJson(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')        // Escape backslashes
        .replace(/"/g, '\\"')                          // Escape quotes
        .replace(/\n/g, '\\n')                         // Handle newlines
        .replace(/\r/g, '\\r')                         // Handle carriage returns
        .replace(/\t/g, '\\t');                        // Handle tabs
}

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

// Handle new memo creation
async function handleMemo(memoData) {
    try {
        // Fetch current tags
        const tagsResult = await chrome.storage.local.get(['tags']);
        const tags = tagsResult.tags || [];
        
        console.log('Processing memo with tags:', tags);
        console.log('Processing memo with content length:', memoData.rawHtml.length);
        
        const processedContent = await processWithClaude(memoData.rawHtml, memoData.url, tags);
        console.log('Received processed content:', processedContent);
        
        const memo = {
            id: Date.now().toString(),
            url: memoData.url,
            favicon: memoData.favicon,
            timestamp: memoData.timestamp,
            sourceHtml: memoData.rawHtml,  // Save the cleaned HTML
            title: processedContent.title,
            summary: processedContent.summary,
            narrative: processedContent.narrative,
            structuredData: processedContent.structuredData,
            tag: processedContent.selectedTag
        };

        // Save to storage
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['memos'], (result) => {
                const memos = result.memos || [];
                memos.unshift(memo);
                chrome.storage.local.set({ memos }, () => {
                    // Notify content script and side panel
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        // Only try to send message to content script if we have an active tab
                        if (tabs && tabs.length > 0) {
                            try {
                                chrome.tabs.sendMessage(tabs[0].id, { action: 'memoSaved' });
                            } catch (error) {
                                console.error('Failed to notify content script:', error);
                                // Don't reject the promise, just log the error
                            }
                        }
                        // Always notify the side panel
                        chrome.runtime.sendMessage({ action: 'memoSaved' });
                        resolve();
                    });
                });
            });
        });

    } catch (error) {
        console.error('Error processing memo:', error);
        console.error('Error details:', error.message);
        // Notify side panel about error
        chrome.runtime.sendMessage({
            action: 'error',
            error: error.message
        });
    }
}

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processMemo') {
        handleMemo(request.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    } else if (request.action === 'setApiKey') {
        initializeAnthropicClient(request.apiKey);
        chrome.storage.local.set({ anthropicApiKey: request.apiKey });
        sendResponse({ success: true });
    } else if (request.action === 'chatMessage') {
        processChatMessage(request.messages)
            .then(response => sendResponse(response))
            .catch(error => {
                console.error('Chat API error:', error);
                sendResponse({ 
                    success: false, 
                    error: error.message 
                });
            });
        return true; // Will respond asynchronously
    }
});

// Load API key on startup
chrome.storage.local.get(['anthropicApiKey'], (result) => {
    if (result.anthropicApiKey) {
        initializeAnthropicClient(result.anthropicApiKey);
    }
}); 