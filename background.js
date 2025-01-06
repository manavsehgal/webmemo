import { Anthropic } from '@anthropic-ai/sdk';

// Store API key securely
let anthropicApiKey = '';
let anthropicClient = null;

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

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

// Function to process content with Claude
async function processWithClaude(content, url, tags) {
    if (!anthropicClient) {
        anthropicClient = new Anthropic({
            apiKey: anthropicApiKey
        });
    }

    // Extract domain from URL
    const domain = new URL(url).hostname;

    // Format tags with descriptions
    const formattedTags = tags.map(tag => ({
        name: tag.name || tag,
        description: tag.description || `Content related to ${tag.name || tag}`
    }));

    console.log('Available tags for classification:', formattedTags);

    const systemPrompt = `You are an AI assistant helping to analyze web content. Your response must be a valid JSON object with no additional text or formatting.

Source Website Information:
- Domain: ${domain}
- URL: ${url}

Your task is to:
1. Generate a concise but descriptive title for the content
2. Create a brief summary (2-3 sentences)
3. If the content has a clear structure, extract the data and convert it to clean JSON format
4. MOST IMPORTANTLY: Create a narrative version which effectively conveys the entire content. This should not be a summary, but an articulately comprehensive version of the content.
5. Select exactly one tag from these options that best matches the content:
${formattedTags.map(tag => `- ${tag.name}: ${tag.description}`).join('\n')}
- Untagged: Content that doesn't clearly match any existing tag.

CRITICAL: Your response must be EXACTLY in this format with no additional text or formatting:
{
    "title": "your generated title",
    "summary": "your generated summary",
    "narrative": "your narrative version",
    "selectedTag": "EXACT_MATCHING_TAG_NAME",
    "structuredData": null
}`;

    try {
        console.log('Sending prompt to Claude with tags:', formattedTags.map(t => t.name));
        
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
            // Log the raw response for debugging
            console.log('Raw Claude response:', response.content[0].text);

            // Clean and prepare the response text
            let cleanedText = response.content[0].text
                .replace(/```json\n?|\n?```/g, '')  // Remove code blocks
                .replace(/^\s*\n/gm, '')           // Remove empty lines
                .trim();                           // Remove leading/trailing whitespace

            console.log('Cleaned text:', cleanedText);

            // Ensure we have a valid JSON object
            if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
                throw new Error('Response is not a valid JSON object');
            }

            // Parse the JSON
            const parsedResponse = JSON.parse(cleanedText);
            
            // Validate required fields
            const requiredFields = ['title', 'summary', 'narrative', 'selectedTag'];
            for (const field of requiredFields) {
                if (!(field in parsedResponse)) {
                    throw new Error(`Missing required field: ${field}`);
                }
                if (typeof parsedResponse[field] !== 'string') {
                    throw new Error(`Field ${field} must be a string`);
                }
            }

            // Create sanitized response
            const sanitizedResponse = {
                title: sanitizeForJson(parsedResponse.title),
                summary: sanitizeForJson(parsedResponse.summary),
                narrative: sanitizeForJson(parsedResponse.narrative),
                selectedTag: parsedResponse.selectedTag,
                structuredData: parsedResponse.structuredData || null
            };

            // Validate selected tag
            const validTags = [...formattedTags.map(t => t.name), 'Untagged'];
            if (!validTags.includes(sanitizedResponse.selectedTag)) {
                console.warn('Invalid tag selected:', sanitizedResponse.selectedTag);
                sanitizedResponse.selectedTag = 'Untagged';
            }

            return sanitizedResponse;
        } catch (e) {
            console.error('Failed to parse Claude response:', e);
            console.error('Response text:', response.content[0].text);
            console.error('Cleaned text:', cleanedText);
            
            // Return a fallback response
            return {
                title: "Error Processing Content",
                summary: "Failed to parse the content into the expected format.",
                narrative: sanitizeForJson(response.content[0].text),
                selectedTag: "Untagged",
                structuredData: null
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
        handleMemo(request.data)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
    } else if (request.action === 'setApiKey') {
        anthropicApiKey = request.apiKey;
        anthropicClient = new Anthropic({
            apiKey: anthropicApiKey,
            defaultHeaders: {
                'anthropic-dangerous-direct-browser-access': 'true'
            }
        });
        chrome.storage.local.set({ anthropicApiKey: request.apiKey });
        sendResponse({ success: true });
    } else if (request.action === 'chatMessage') {
        if (!anthropicClient) {
            sendResponse({ 
                success: false, 
                error: 'Anthropic API key not set. Please set your API key first.' 
            });
            return true;
        }

        // Extract system message if it exists
        const systemMessage = request.messages.find(m => m.role === 'system')?.content;
        const chatMessages = request.messages.filter(m => m.role !== 'system');

        anthropicClient.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            system: systemMessage,
            messages: chatMessages
        })
        .then(response => {
            sendResponse({ 
                success: true, 
                reply: response.content[0].text 
            });
        })
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