import { AnthropicProvider } from './anthropic-api.js';

// Factory class for creating LLM provider instances
export class LLMProviderFactory {
    static createProvider(type, config) {
        switch (type) {
            case 'anthropic':
                return new AnthropicProvider(config);
            default:
                throw new Error(`Provider type '${type}' not implemented yet`);
        }
    }

    // Get list of available providers
    static getAvailableProviders() {
        return [
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                description: 'Claude AI by Anthropic',
                requiresApiKey: true,
                models: ['claude-3-5-sonnet-20241022']
            }
        ];
    }

    // Validate provider configuration
    static validateConfig(type, config) {
        switch (type) {
            case 'anthropic':
                if (!config.apiKey) {
                    throw new Error('Anthropic API key is required');
                }
                break;
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
} 