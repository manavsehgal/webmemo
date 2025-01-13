import { showStatus, hideStatus } from './status.js';
import {
    loadMemos,
    filterMemosByTag
} from './memos.js';
import {
    predefinedTags,
    initializeTags,
    loadTags,
    updateTagCounts,
    createTagElement,
    addNewTag
} from './tags.js';
import { saveToStorage, backupData, showDeleteConfirmation } from './storage.js';
import { 
    countWords, 
    deleteMemo, 
    displayMemoList, 
    displayMemoDetail,
    getTagStyle
} from './ui.js';
import { createSystemMessage, calculateTokenCount } from './anthropic-api.js';

// UI Elements
const memoButton = document.getElementById('memoButton');
const memosButton = document.getElementById('memosButton');
const memoListView = document.getElementById('memoListView');
const memoDetailView = document.getElementById('memoDetailView');
const backButton = document.getElementById('backButton');
const memoDetail = document.getElementById('memoDetail');

let isHighlightMode = false;
let currentMemo = null;

// Chat functionality
let currentChatTag = null;
let chatMessages = [];

// Initialize saved chats
let savedChats = [];
const saveChatButton = document.getElementById('saveChatButton');

// Add current filter state
let currentTagFilter = null;

// Handle sending a message
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || !currentChatTag) return;

    // Clear input
    input.value = '';
    input.style.height = '4.5rem';

    // Add user message
    addChatMessage('user', message);
    chatMessages.push({ role: 'user', content: message });

    // Show typing indicator
    document.getElementById('chatTypingIndicator').classList.remove('hidden');
    input.disabled = true;  // Disable input while processing

    try {
        // Send message through background script
        const response = await chrome.runtime.sendMessage({
            action: 'chatMessage',
            messages: chatMessages
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to get response');
        }

        // Add assistant message
        addChatMessage('assistant', response.reply);
        chatMessages.push({ role: 'assistant', content: response.reply });

    } catch (error) {
        console.error('Chat error:', error);
        addChatMessage('assistant', 'I apologize, but I encountered an error. Please try again.');
        if (error.message.includes('API key not set')) {
            checkApiKey();
        }
    } finally {
        // Hide typing indicator
        document.getElementById('chatTypingIndicator').classList.add('hidden');
        input.disabled = false;  // Re-enable input
    }
}

// Make sendMessage available globally
window.sendMessage = sendMessage;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeExtension();
    
    // Add click handler for settings button
    document.getElementById('settingsButton').addEventListener('click', () => {
        // Hide other panels
        document.getElementById('tagsPanel').classList.add('hidden');
        document.getElementById('memoListView').classList.add('hidden');
        document.getElementById('memoDetailView').classList.add('hidden');
        document.getElementById('chatPanel').classList.add('hidden');
        
        // Show settings panel
        document.getElementById('settingsPanel').classList.remove('hidden');
        
        // Reset capture mode if active
        if (isHighlightMode) {
            resetMemoButton();
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                try {
                    await chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleHighlightMode',
                        enabled: false
                    });
                } catch (error) {
                    console.error('Failed to disable highlight mode:', error);
                }
            });
        }
    });

    // Add click handler for memos button
    memosButton.addEventListener('click', async () => {
        // Clear filter
        currentTagFilter = null;
        
        // Hide other panels
        document.getElementById('tagsPanel').classList.add('hidden');
        document.getElementById('chatPanel').classList.add('hidden');
        
        // If in detail view, go back to list
        memoDetailView.classList.add('hidden');
        memoListView.classList.remove('hidden');
        
        // Show all memos
        const result = await chrome.storage.local.get(['memos']);
        displayMemoList(result.memos || []);
        
        // Show notification if we cleared a filter
        if (currentTagFilter) {
            showStatus('success', 'Showing all memos');
        }
        
        // Reset capture mode if active
        if (isHighlightMode) {
            resetMemoButton();
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                try {
                    await chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleHighlightMode',
                        enabled: false
                    });
                } catch (error) {
                    console.error('Failed to disable highlight mode:', error);
                }
            });
        }
    });

    // Add click handler for chat button
    document.getElementById('chatButton').addEventListener('click', () => {
        // Hide other panels
        document.getElementById('tagsPanel').classList.add('hidden');
        document.getElementById('memoListView').classList.add('hidden');
        document.getElementById('memoDetailView').classList.add('hidden');
        document.getElementById('settingsPanel').classList.add('hidden');
        
        // Show chat panel
        document.getElementById('chatPanel').classList.remove('hidden');
        document.getElementById('chatTagSelection').classList.remove('hidden');
        document.getElementById('chatInterface').classList.add('hidden');
        
        // Initialize chat tags
        initializeChatTags();
        
        // Reset capture mode if active
        if (isHighlightMode) {
            resetMemoButton();
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                try {
                    await chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleHighlightMode',
                        enabled: false
                    });
                } catch (error) {
                    console.error('Failed to disable highlight mode:', error);
                }
            });
        }
    });

    // Add save button handler
    saveChatButton.addEventListener('click', saveCurrentChat);

    // Display saved chats
    displaySavedChats();

    // Add source toggle handler
    const sourceToggle = document.getElementById('sourceToggle');
    if (sourceToggle) {
        sourceToggle.addEventListener('change', async () => {
            if (currentChatTag && chatMessages.length > 0) {
                const result = await chrome.storage.local.get(['memos']);
                const memos = result.memos || [];
                const taggedMemos = memos.filter(memo => memo.tag === currentChatTag.name);
                
                // Update token count before creating system message
                updateTokenCount(taggedMemos, sourceToggle.checked);
                
                // Create new system message
                const systemMsg = createSystemMessage(taggedMemos, currentChatTag, sourceToggle.checked);
                
                // Update chat messages with new system message
                chatMessages = chatMessages.filter(msg => msg.role !== 'system');
                chatMessages.unshift({ role: 'system', content: systemMsg });
                
                // Add a system notification in the chat
                addChatMessage('assistant', 
                    sourceToggle.checked ? 
                    "I'm now using the original source content of the memos for our conversation." :
                    "I'm now using the processed narratives and structured data from the memos for our conversation."
                );
            }
        });
    }

    // Add visibility toggle handlers
    document.querySelectorAll('.toggle-visibility').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('svg');
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = `
                    <path d="M13.875 7.375c-.621-.462-1.373-.875-2.188-1.125.25.5.438 1.062.438 1.75 0 1.938-1.562 3.5-3.5 3.5-1.938 0-3.5-1.562-3.5-3.5 0-.688.188-1.25.438-1.75C4.75 6.5 4 6.938 3.375 7.375 2.625 8 2 8.875 2 10c0 4.438 3.562 8 8 8s8-3.562 8-8c0-1.125-.625-2-1.875-2.625zM8.625 10c0-1.062.875-1.938 1.938-1.938 1.062 0 1.938.875 1.938 1.938 0 1.062-.875 1.938-1.938 1.938-1.062 0-1.938-.875-1.938-1.938z" />
                `;
            } else {
                input.type = 'password';
                icon.innerHTML = `
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                `;
            }
        });
    });

    // Add save settings handler
    document.getElementById('saveSettings').addEventListener('click', async () => {
        const settings = {
            anthropicApiKey: document.getElementById('anthropicKey').value
        };

        try {
            // Save to storage
            await saveToStorage('settings', settings);
            
            // Update Anthropic client
            if (settings.anthropicApiKey) {
                await chrome.runtime.sendMessage({
                    action: 'setApiKey',
                    apiKey: settings.anthropicApiKey
                });
            }

            showStatus('success', 'Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showStatus('error', 'Failed to save settings');
        }
    });

    // Update chat input styling and behavior
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.style.minHeight = '4.5rem';
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        chatInput.addEventListener('input', function() {
            this.style.height = '4.5rem';
            this.style.height = Math.min(this.scrollHeight, 160) + 'px';
        });
    }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'selectionMade') {
        showStatus('selected');
        setSavingState();
    } else if (message.action === 'memoSaved') {
        loadMemos(); // Refresh the memo list
        showStatus('success', 'Memo saved');
        resetMemoButton();
    } else if (message.action === 'error') {
        showStatus('error', message.error);
        resetMemoButton();
        if (message.error.includes('API key not set')) {
            checkApiKey();
        }
    } else if (message.action === 'savingMemo') {
        showStatus('processing', 'Extracting content with AI');
    }
});

// Check and prompt for API key
async function checkApiKey() {
    try {
        const result = await chrome.storage.sync.get(['anthropicApiKey']);
        if (!result.anthropicApiKey) {
            const apiKey = prompt('Please enter your Anthropic API key to enable memo processing:');
            if (apiKey) {
                await chrome.storage.sync.set({ anthropicApiKey: apiKey });
                await chrome.runtime.sendMessage({
                    action: 'setApiKey',
                    apiKey
                });
                showStatus('api', 'API key saved');
                return true;
            } else {
                showStatus('error', 'API key is required');
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Error checking API key:', error);
        showStatus('error', 'Failed to check API key');
        return false;
    }
}

// Initialize extension
async function initializeExtension() {
    try {
        // Load API key and data from storage
        const result = await chrome.storage.local.get([
            'anthropicApiKey',
            'memos',
            'tags',
            'savedChats'
        ]);

        // Check if we have any data in local storage
        const hasLocalData = result.memos || result.tags || result.savedChats;
        
        if (!hasLocalData) {
            // Try to recover from sync storage as fallback
            const syncResult = await chrome.storage.sync.get(['memos_meta', 'chats_meta', 'tags']);
            if (syncResult.memos_meta || syncResult.tags || syncResult.chats_meta) {
                // Found metadata in sync storage, restore what we can
                await chrome.storage.local.set({
                    memos: syncResult.memos_meta || [],
                    tags: syncResult.tags || predefinedTags,
                    savedChats: syncResult.chats_meta || []
                });
                console.log('Restored metadata from sync storage');
                showStatus('success', 'Partially restored data from backup');
            }
        }

        // Set API key in form if available
        if (result.anthropicApiKey) {
            document.getElementById('anthropicKey').value = result.anthropicApiKey;
            await chrome.runtime.sendMessage({
                action: 'setApiKey',
                apiKey: result.anthropicApiKey
            });
        }

        // Initialize other components
        await initializeTags();
        loadMemos();
        
        // Check API key after initialization
        await checkApiKey();

        // Backup metadata to sync storage
        await backupData();
        
    } catch (error) {
        console.error('Error initializing extension:', error);
        showStatus('error', 'Failed to initialize extension');
    }
}

// Set button to saving state
function setSavingState() {
    memoButton.textContent = 'Processing...';
    memoButton.disabled = true;
    memoButton.classList.remove('bg-red-500', 'bg-blue-500', 'hover:bg-blue-600');
    memoButton.classList.add('bg-gray-400', 'cursor-not-allowed');
}

// Reset button to initial state
function resetMemoButton() {
    isHighlightMode = false;
    memoButton.textContent = 'Capture';
    memoButton.disabled = false;
    memoButton.classList.remove('bg-red-500', 'bg-gray-400', 'cursor-not-allowed');
    memoButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
    document.getElementById('selectionGuide').classList.add('hidden');
    hideStatus(); // Hide the status notification
}

// Toggle highlight mode
memoButton.addEventListener('click', async () => {
    if (memoButton.disabled) return;
    
    // Check for API key before enabling highlight mode
    const result = await chrome.storage.local.get(['anthropicApiKey']);
    if (!result.anthropicApiKey) {
        showStatus('error', 'Please set your API key first');
        checkApiKey();
        return;
    }

    isHighlightMode = !isHighlightMode;
    if (isHighlightMode) {
        memoButton.textContent = 'Cancel';
        memoButton.classList.remove('bg-blue-500');
        memoButton.classList.add('bg-red-500');
        showStatus('select');
    } else {
        resetMemoButton();
    }
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        try {
            // First check if we can inject the content script
            await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
            });
            
            // Then send the message
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleHighlightMode',
                enabled: isHighlightMode
            });
        } catch (error) {
            console.error('Failed to toggle highlight mode:', error);
            showToast('Cannot enable highlighting on this page. Please try refreshing the page.', 'error');
            resetMemoButton();
        }
    });
});

// Back button handler
backButton.addEventListener('click', () => {
    memoDetailView.classList.add('hidden');
    memoListView.classList.remove('hidden');
});

// Copy button handler
document.getElementById('copyButton').addEventListener('click', () => {
    const content = {
        title: document.getElementById('memoTitle').textContent,
        summary: document.getElementById('memoSummary').textContent,
        narrative: document.getElementById('memoNarrative').innerHTML,
        structuredData: document.getElementById('memoJson').textContent,
        sourceHtml: currentMemo.sourceHtml
    };
    
    navigator.clipboard.writeText(JSON.stringify(content, null, 2))
        .then(() => showStatus('copy'))
        .catch(err => {
            console.error('Failed to copy:', err);
            showStatus('error', 'Could not copy to clipboard');
        });
});

// Download button handler
document.getElementById('downloadButton').addEventListener('click', () => {
    const content = {
        title: document.getElementById('memoTitle').textContent,
        summary: document.getElementById('memoSummary').textContent,
        narrative: document.getElementById('memoNarrative').innerHTML,
        structuredData: document.getElementById('memoJson').textContent,
        sourceHtml: currentMemo.sourceHtml,
        url: document.getElementById('memoSource').href,
        timestamp: document.getElementById('memoTimestamp').textContent
    };
    
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memo-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('download');
});

// Delete button handler
document.getElementById('deleteButton').addEventListener('click', () => {
    if (currentMemo) {
        deleteMemo(currentMemo.id);
    }
});

// Initialize chat interface
async function initializeChatTags() {
    const result = await chrome.storage.local.get(['memos', 'tags']);
    const memos = result.memos || [];
    const tags = result.tags || [];
    const tagsList = document.getElementById('chatTagsList');
    tagsList.innerHTML = '';

    // Count memos for each tag
    const counts = memos.reduce((acc, memo) => {
        const tag = memo.tag || 'Untagged';
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});

    // Create tag pills for tags with memos
    tags.forEach(tag => {
        const count = counts[tag.name] || 0;
        if (count > 0) {
            const tagPill = document.createElement('button');
            tagPill.className = `chat-tag-pill flex items-center space-x-2 px-3 py-1.5 bg-${tag.color}-100 text-${tag.color}-700 rounded-full hover:bg-${tag.color}-200 transition-colors duration-200`;
            tagPill.innerHTML = `
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    ${tag.icon}
                </svg>
                <span>${tag.name}</span>
                <span class="bg-${tag.color}-200 text-${tag.color}-800 text-xs px-2 py-0.5 rounded-full">${count}</span>
            `;
            tagPill.addEventListener('click', () => selectChatTag(tag));
            tagsList.appendChild(tagPill);
        }
    });
}

// Select a tag for chat
async function selectChatTag(tag) {
    // Check API key first
    const hasApiKey = await checkApiKey();
    if (!hasApiKey) {
        return; // Don't proceed if API key is not set
    }

    currentChatTag = tag;
    const result = await chrome.storage.local.get(['memos', 'savedChats']);
    const memos = result.memos || [];
    const savedChats = result.savedChats || [];
    
    // Filter memos by tag
    const taggedMemos = memos.filter(memo => memo.tag === tag.name);
    
    // Show chat interface
    document.getElementById('chatTagSelection').classList.add('hidden');
    document.getElementById('chatInterface').classList.remove('hidden');
    
    // Set chat intro
    document.getElementById('chatIntro').textContent = 
        `I am ready to chat about memos tagged as ${tag.name} (${tag.description})...`;
    
    // Reset chat
    chatMessages = [];
    document.getElementById('chatMessages').innerHTML = '';
    
    // Reset source toggle and update token count
    const sourceToggle = document.getElementById('sourceToggle');
    sourceToggle.checked = false;
    updateTokenCount(taggedMemos, false);
    
    // Create system message
    const systemMsg = createSystemMessage(taggedMemos, currentChatTag, false);
    chatMessages.push({ role: 'system', content: systemMsg });

    // Display filtered saved chats
    displayTagFilteredSavedChats(tag.name);
}

// Update token count display
function updateTokenCount(memos, useSource = false) {
    const tokenCount = calculateTokenCount(memos, useSource);
    const tokenCountElement = document.getElementById('tokenCount');
    tokenCountElement.textContent = `This chat will cost around ${tokenCount.toLocaleString()} tokens`;
}

// Add a message to the chat
function addChatMessage(role, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message mb-4';

    if (role === 'user') {
        messageDiv.className += ' flex justify-end';
        messageDiv.innerHTML = `
            <div class="max-w-[80%] bg-blue-500 text-white px-4 py-2 rounded-lg rounded-tr-none">
                <p class="text-sm">${content}</p>
            </div>
        `;
    } else if (role === 'assistant') {
        // Extract memo citations from the content
        const citedMemos = [];
        const contentWithLinks = content.replace(/\[(.*?)\]/g, (match, title) => {
            if (!citedMemos.includes(title)) {
                citedMemos.push(title);
            }
            return match;
        });
        
        messageDiv.innerHTML = `
            <div class="bg-white rounded-lg shadow p-4">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">${contentWithLinks}</p>
                ${citedMemos.length > 0 ? `
                    <div class="mt-2 pt-2 border-t border-gray-200">
                        <p class="text-xs font-semibold text-gray-600 mb-2">Memos cited:</p>
                        <div class="space-y-1.5">
                            ${citedMemos.map((title, index) => `
                                <div class="flex items-baseline gap-2">
                                    <span class="text-xs text-gray-500">${index + 1}.</span>
                                    <button class="memo-citation text-xs text-blue-600 hover:text-blue-800 hover:underline text-left flex-1" 
                                            data-memo-title="${title.replace(/"/g, '&quot;')}">${title}</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Add click handlers for memo citations
        const citationButtons = messageDiv.querySelectorAll('.memo-citation');
        citationButtons.forEach(button => {
            button.addEventListener('click', () => {
                const title = button.dataset.memoTitle;
                showMemoByTitle(title);
            });
        });

        // Show save button after first assistant response
        const saveButton = document.getElementById('saveChatButton');
        saveButton.classList.remove('hidden');
        saveButton.classList.add('flex');  // Make it flex to align icon and text
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to show memo by title
async function showMemoByTitle(title) {
    const result = await chrome.storage.local.get(['memos']);
    const memos = result.memos || [];
    const memo = memos.find(m => m.title === title);
    if (memo) {
        // Hide chat panel
        document.getElementById('chatPanel').classList.add('hidden');
        // Show memo detail view and hide memo list view
        document.getElementById('memoDetailView').classList.remove('hidden');
        document.getElementById('memoListView').classList.add('hidden');
        // Show memo detail
        displayMemoDetail(memo);
    }
}

// Make showMemoByTitle available to onclick handlers
window.showMemoByTitle = showMemoByTitle;

// Save current chat
async function saveCurrentChat() {
    if (chatMessages.length < 2) return; // Need at least one user message and one response

    const firstUserMessage = chatMessages.find(m => m.role === 'user');
    const title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    
    const savedChat = {
        id: Date.now(),
        title,
        tag: currentChatTag,
        timestamp: new Date().toISOString(),
        messages: [...chatMessages]
    };

    // Save to storage
    const result = await chrome.storage.local.get(['savedChats']);
    const savedChats = result.savedChats || [];
    savedChats.unshift(savedChat);
    await saveToStorage('savedChats', savedChats);

    // Clear current chat
    chatMessages = [];
    document.getElementById('chatMessages').innerHTML = '';
    const saveButton = document.getElementById('saveChatButton');
    saveButton.classList.add('hidden');
    saveButton.classList.remove('flex');

    // Show tag selection with updated saved chats
    document.getElementById('chatInterface').classList.add('hidden');
    document.getElementById('chatTagSelection').classList.remove('hidden');
    
    // Update both the chat tags and saved chats list
    await initializeChatTags();
    displaySavedChats();
    
    // Show success message
    showStatus('success', 'Chat saved successfully');
}

// Display saved chats
function displaySavedChats() {
    const savedChatsList = document.getElementById('savedChatsList');
    savedChatsList.innerHTML = '';

    chrome.storage.local.get(['savedChats'], (result) => {
        const savedChats = result.savedChats || [];
        
        if (savedChats.length === 0) {
            savedChatsList.innerHTML = `
                <div class="text-sm text-gray-500 italic">
                    No saved chats yet
                </div>
            `;
            return;
        }
        
        savedChats.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.className = 'bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200';
            chatElement.innerHTML = `
                <div class="flex flex-col">
                    <h4 class="text-sm font-medium text-gray-800">${chat.title}</h4>
                    <div class="flex justify-between items-center mt-1">
                        <p class="text-xs text-gray-500">
                            ${new Date(chat.timestamp).toLocaleString()}
                        </p>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs px-2 py-1 rounded-full bg-${chat.tag.color}-100 text-${chat.tag.color}-700 whitespace-nowrap">
                                ${chat.tag.name}
                            </span>
                            <button class="delete-chat text-gray-400 hover:text-red-500 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Add click handler for loading the chat (excluding delete button)
            chatElement.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-chat')) {
                    loadSavedChat(chat);
                    document.getElementById('chatTagSelection').classList.add('hidden');
                    document.getElementById('chatInterface').classList.remove('hidden');
                }
            });

            // Add click handler for delete button
            const deleteButton = chatElement.querySelector('.delete-chat');
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showDeleteConfirmation('Are you sure you want to delete this saved chat?');
                if (confirmed) {
                    const result = await chrome.storage.local.get(['savedChats']);
                    const savedChats = result.savedChats || [];
                    const updatedChats = savedChats.filter(c => c.id !== chat.id);
                    await chrome.storage.local.set({ savedChats: updatedChats });
                    showStatus('success', 'Chat deleted');
                    displaySavedChats();
                }
            });
            
            savedChatsList.appendChild(chatElement);
        });
    });
}

// Load a saved chat
function loadSavedChat(chat) {
    // Set current tag and messages
    currentChatTag = chat.tag;
    chatMessages = [...chat.messages];

    // Display messages
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    chatMessages.forEach(message => {
        if (message.role !== 'system') {
            addChatMessage(message.role, message.content);
        }
    });

    // Show save button
    saveChatButton.classList.remove('hidden');
    
    // Display filtered saved chats for the current tag
    displayTagFilteredSavedChats(chat.tag.name);
}

// Update the tag-related event listeners
document.getElementById('tagsButton').addEventListener('click', async () => {
    document.getElementById('memoListView').classList.add('hidden');
    document.getElementById('memoDetailView').classList.add('hidden');
    document.getElementById('chatPanel').classList.add('hidden');
    document.getElementById('settingsPanel').classList.add('hidden');
    document.getElementById('tagsPanel').classList.remove('hidden');
    await loadTags();
    updateTagCounts();
});

document.getElementById('addTagButton').addEventListener('click', () => {
    document.getElementById('addTagForm').classList.remove('hidden');
});

document.getElementById('cancelAddTag').addEventListener('click', () => {
    document.getElementById('addTagForm').classList.add('hidden');
    document.getElementById('newTagName').value = '';
    document.getElementById('newTagDescription').value = '';
});

document.getElementById('saveNewTag').addEventListener('click', async () => {
    const name = document.getElementById('newTagName').value.trim();
    const description = document.getElementById('newTagDescription').value.trim();
    
    const success = await addNewTag(name, description);
    if (success) {
        // Clear form and hide it
        document.getElementById('newTagName').value = '';
        document.getElementById('newTagDescription').value = '';
        document.getElementById('addTagForm').classList.add('hidden');
    }
});

// Display saved chats filtered by tag
function displayTagFilteredSavedChats(tagName) {
    const savedChatsSection = document.getElementById('savedChatsSection');
    
    chrome.storage.local.get(['savedChats'], (result) => {
        const savedChats = result.savedChats || [];
        const filteredChats = savedChats.filter(chat => chat.tag.name === tagName);
        
        if (filteredChats.length === 0) {
            savedChatsSection.innerHTML = '';
            return;
        }
        
        savedChatsSection.innerHTML = `
            <div class="border-t pt-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">Related Saved Chats</h3>
                <div class="space-y-2">
                    ${filteredChats.map(chat => `
                        <div class="bg-white rounded-lg shadow p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200" 
                             data-chat-id="${chat.id}">
                            <div class="flex flex-col">
                                <h4 class="text-sm font-medium text-gray-800">${chat.title}</h4>
                                <div class="flex justify-between items-center mt-1">
                                    <p class="text-xs text-gray-500">
                                        ${new Date(chat.timestamp).toLocaleString()}
                                    </p>
                                    <button class="delete-filtered-chat text-gray-400 hover:text-red-500 p-1" data-chat-id="${chat.id}">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Add click handlers for loading chats
        filteredChats.forEach(chat => {
            const chatElement = savedChatsSection.querySelector(`[data-chat-id="${chat.id}"]`);
            chatElement.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-filtered-chat')) {
                    loadSavedChat(chat);
                }
            });

            // Add click handler for delete button
            const deleteButton = chatElement.querySelector('.delete-filtered-chat');
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showDeleteConfirmation('Are you sure you want to delete this saved chat?');
                if (confirmed) {
                    const result = await chrome.storage.local.get(['savedChats']);
                    const savedChats = result.savedChats || [];
                    const updatedChats = savedChats.filter(c => c.id !== chat.id);
                    await chrome.storage.local.set({ savedChats: updatedChats });
                    showStatus('success', 'Chat deleted');
                    displaySavedChats(); // Update main saved chats list
                    displayTagFilteredSavedChats(tagName); // Update filtered list
                }
            });
        });
    });
} 