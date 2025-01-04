import { Anthropic } from '@anthropic-ai/sdk';

// Store API key securely
let anthropicApiKey = '';
let anthropicClient = null;

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

// Function to process content with Claude
async function processWithClaude(content) {
    if (!anthropicClient) {
        anthropicClient = new Anthropic({
            apiKey: anthropicApiKey,
            defaultHeaders: {
                'anthropic-dangerous-direct-browser-access': 'true'
            }
        });
    }

    const systemPrompt = `You are an AI assistant helping to analyze web content. Your task is to:
1. Generate a concise but descriptive title for the content
2. Create a brief summary (2-3 sentences)
3. Analyze the text and html tags:
   - If any part of the content represents structured data like a table or key value pairs: Convert to clean JSON format
   - Create a text narrative in proper English based on all of the source content including structured data.
Please respond in JSON format with fields: title, summary, narrative (if applicable), structuredData (if applicable)`;

    try {
        const response = await anthropicClient.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: content
                }
            ]
        });

        try {
            return JSON.parse(response.content[0].text);
        } catch (e) {
            // If parsing fails, return a structured error response
            return {
                title: "Error Processing Content",
                summary: "Failed to parse the content into the expected format.",
                narrative: response.content[0].text
            };
        }
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error(`Failed to process with Claude: ${error.message}`);
    }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processMemo') {
        handleMemo(request.data);
    } else if (request.action === 'setApiKey') {
        anthropicApiKey = request.apiKey;
        anthropicClient = new Anthropic({
            apiKey: anthropicApiKey,
            defaultHeaders: {
                'anthropic-dangerous-direct-browser-access': 'true'
            }
        });
        chrome.storage.local.set({ anthropicApiKey: request.apiKey });
    }
});

// Load API key on startup
chrome.storage.local.get(['anthropicApiKey'], (result) => {
    if (result.anthropicApiKey) {
        anthropicApiKey = result.anthropicApiKey;
        anthropicClient = new Anthropic({
            apiKey: anthropicApiKey,
            defaultHeaders: {
                'anthropic-dangerous-direct-browser-access': 'true'
            }
        });
    }
});

// Handle new memo creation
async function handleMemo(memoData) {
    try {
        if (!anthropicApiKey) {
            // Notify side panel about missing API key
            chrome.runtime.sendMessage({
                action: 'error',
                error: 'Anthropic API key not set. Please set your API key first.'
            });
            throw new Error('Anthropic API key not set');
        }

        console.log('Processing memo with content length:', memoData.rawHtml.length);
        const processedContent = await processWithClaude(memoData.rawHtml);
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
            structuredData: processedContent.structuredData
        };

        // Save to storage
        chrome.storage.local.get(['memos'], (result) => {
            const memos = result.memos || [];
            memos.unshift(memo);
            chrome.storage.local.set({ memos });
            
            // Notify content script and side panel
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'memoSaved' });
            });
            chrome.runtime.sendMessage({ action: 'memoSaved' });
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