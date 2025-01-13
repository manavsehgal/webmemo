// Browser-compatible Anthropic client
class AnthropicClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.anthropic.com/v1';
    }

    async messages(options) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: options.model || "claude-3-5-sonnet-20241022",
                max_tokens: options.max_tokens || 4096,
                system: options.system,
                messages: options.messages
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return {
            content: [{ text: data.content[0].text }]
        };
    }
}

// Create Anthropic class with the same interface as the SDK
export class Anthropic {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.messages = {
            create: (options) => new AnthropicClient(this.apiKey).messages(options)
        };
    }
}

// Store API key securely
let anthropicApiKey = '';
let anthropicClient = null;

// Initialize Anthropic client
export function initializeAnthropicClient(apiKey) {
    anthropicApiKey = apiKey;
    anthropicClient = new Anthropic({
        apiKey: anthropicApiKey
    });
    return anthropicClient;
}

// Get current Anthropic client
export function getAnthropicClient() {
    return anthropicClient;
}

// Process chat message
export async function processChatMessage(messages) {
    if (!anthropicClient) {
        throw new Error('Anthropic API key not set. Please set your API key first.');
    }

    // Extract system message if it exists
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages.filter(m => m.role !== 'system');

    try {
        const response = await anthropicClient.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            system: systemMessage,
            messages: chatMessages
        });
        return { success: true, reply: response.content[0].text };
    } catch (error) {
        console.error('Chat API error:', error);
        throw error;
    }
}

// Process memo with Claude
export async function processWithClaude(rawHtml, url, tags) {
    if (!anthropicClient) {
        throw new Error('Anthropic API key not set');
    }

    try {
        const systemMessage = `You are an AI assistant that processes web content into structured memos. 
        Given HTML content and a URL, you will:
        1. Extract and summarize the key information
        2. Create a narrative version
        3. Generate structured data
        4. Select the most appropriate tag from the available tags
        
        Available tags: ${tags.map(t => t.name).join(', ')}`;

        const response = await anthropicClient.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            system: systemMessage,
            messages: [{
                role: 'user',
                content: `Process this web content into a memo:
                URL: ${url}
                Content: ${rawHtml}
                
                Return the results in this JSON format:
                {
                    "title": "Extracted title",
                    "summary": "Brief summary",
                    "narrative": "Narrative version",
                    "structuredData": {}, // Relevant structured data
                    "selectedTag": "Most appropriate tag"
                }`
            }]
        });

        return JSON.parse(response.content[0].text);
    } catch (error) {
        console.error('Error processing with Claude:', error);
        throw error;
    }
}

// Create system message for chat
export function createSystemMessage(taggedMemos, currentChatTag, useSource = false) {
    // Create memo context based on toggle state
    const memoContext = taggedMemos.map((memo, index) => {
        if (useSource) {
            return `
                [Memo ${index + 1}]
                Title: ${memo.title}
                Source Content: ${memo.sourceHtml}
                URL: ${memo.url}
            `;
        } else {
            return `
                [Memo ${index + 1}]
                Title: ${memo.title}
                Narrative: ${memo.narrative}
                Structured Data: ${JSON.stringify(memo.structuredData)}
            `;
        }
    }).join('\n\n');

    return `You are a helpful assistant with access to a collection of memos tagged as "${currentChatTag.name}". 
    
    Refer to this associated tag and description when responding to user prompt:
    Tag: ${currentChatTag.name}
    Description: ${currentChatTag.description}
    
    When responding to user queries, prioritize information from these memos:
    
    ${memoContext}
    
    ${useSource ? 
        `You are now working with the original source content of the memos. Use this raw content to provide detailed, accurate responses based on the original material.` : 
        `You are working with processed narratives and structured data from the memos. Use this curated content to provide focused, organized responses.`}
    
    You can also use your general knowledge to provide additional context and insights beyond what's in the memos.
    Always be clear when you're referencing memo content versus providing supplementary information.
    
    When you reference information from a memo, cite it using its title in square brackets like this: [Title of Memo].
    If you reference multiple memos, cite each one where its information is used.
    Always cite memos when you use their information in your response.`;
}

// Calculate token count
export function calculateTokenCount(memos, useSource = false) {
    const wordCount = calculateMemosWordCount(memos, useSource);
    return Math.round(wordCount * 1.3);
}

// Helper function to calculate word count
function calculateMemosWordCount(memos, useSource = false) {
    return memos.reduce((total, memo) => {
        if (useSource) {
            return total + countWords(memo.sourceHtml);
        } else {
            return total + countWords(memo.narrative) + 
                   countWords(JSON.stringify(memo.structuredData));
        }
    }, 0);
}

// Helper function to count words
function countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
} 