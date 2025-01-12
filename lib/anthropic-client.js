// Browser-compatible Anthropic client
export class AnthropicClient {
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