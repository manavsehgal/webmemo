import { Anthropic } from '@anthropic-ai/sdk';

// Store API key securely
let anthropicApiKey = '';
let anthropicClient = null;

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

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

    const systemPrompt = `You are an AI assistant helping to analyze web content. 

Source Website Information:
- Domain: ${domain}
- URL: ${url}

Your task is to:
1. Generate a concise but descriptive title for the content
2. Create a brief summary (2-3 sentences)
3. Based on the content type:
   - If it's structured data: Convert to clean JSON format
   - If it's narrative content: Create a well-formatted narrative version
4. MOST IMPORTANTLY: Select exactly one tag from these options that best matches the content:
${formattedTags.map(tag => `- ${tag.name}: ${tag.description}`).join('\n')}
- Untagged: Content that doesn't clearly match any existing tag.

CRITICAL INSTRUCTIONS FOR TAG SELECTION:
- You MUST choose exactly one tag
- The selectedTag field in your response MUST be a string that exactly matches one of the tag names listed above
- If no tag clearly matches, use "Untagged"
- Do not create new tags or modify existing tag names

Respond with this exact JSON structure:
{
    "title": "your generated title",
    "summary": "your generated summary",
    "narrative": "your narrative version if applicable",
    "selectedTag": "EXACT_MATCHING_TAG_NAME",
    "structuredData": "your structured data if applicable"
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
            const parsedResponse = JSON.parse(response.content[0].text);
            console.log('Claude response:', parsedResponse);
            
            // Validate selected tag
            const validTags = [...formattedTags.map(t => t.name), 'Untagged'];
            if (!validTags.includes(parsedResponse.selectedTag)) {
                console.warn('Invalid tag selected:', parsedResponse.selectedTag);
                parsedResponse.selectedTag = 'Untagged';
            }
            
            return parsedResponse;
        } catch (e) {
            console.error('Failed to parse Claude response:', e);
            return {
                title: "Error Processing Content",
                summary: "Failed to parse the content into the expected format.",
                narrative: response.content[0].text,
                selectedTag: "Untagged"
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