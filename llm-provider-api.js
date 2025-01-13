// Base class for LLM providers
export class LLMProvider {
    constructor(config = {}) {
        this.config = config;
        this.initialized = false;
    }

    // Initialize the provider with API key
    async initialize(apiKey) {
        throw new Error('initialize() must be implemented by provider');
    }

    // Process chat messages
    async chat(messages, options = {}) {
        throw new Error('chat() must be implemented by provider');
    }

    // Process webpage content
    async processMemo(content, options = {}) {
        throw new Error('processMemo() must be implemented by provider');
    }

    // Calculate token count for text
    calculateTokens(text) {
        throw new Error('calculateTokens() must be implemented by provider');
    }

    // Create system message for chat context
    createSystemMessage(taggedMemos = [], currentChatTag = null, useSource = false) {
        let systemMessage = 'You are a helpful AI assistant. ';

        if (taggedMemos.length > 0) {
            const totalWords = this.calculateMemosWordCount(taggedMemos, useSource);
            systemMessage += `You have access to ${taggedMemos.length} saved memos containing ${totalWords} words of content`;
            
            if (currentChatTag) {
                systemMessage += ` tagged with "${currentChatTag}"`;
            }
            
            systemMessage += '. ';
            systemMessage += 'Use this content to provide informed responses while citing specific memos when referencing information from them.';
        }

        return systemMessage;
    }

    // Count words in text
    countWords(text) {
        return text.trim().split(/\s+/).length;
    }

    // Calculate total word count for memos
    calculateMemosWordCount(memos, useSource = false) {
        return memos.reduce((total, memo) => {
            const content = useSource ? memo.rawHtml : memo.content;
            return total + this.countWords(content);
        }, 0);
    }

    // Sanitize content for processing
    sanitizeContent(content) {
        if (!content) return '';
        
        // Remove control characters except newlines and tabs
        content = content.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Escape backslashes and quotes
        content = content.replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"');
        
        return content;
    }
} 