// Import tag functions
import { 
    initializeTags, 
    loadTags as loadTagsFromModule, 
    updateTagCounts,
    initializeTagManagement,
    initializeChatTags,
    selectChatTag as selectChatTagFromModule
} from './modules/tags.js';
// Import chat functions
import { 
    displaySavedChats,
    loadSavedChat,
    saveCurrentChat as saveCurrentChatModule,
    sendMessage as sendMessageModule,
    createSystemMessage,
    addChatMessage
} from './modules/chat.js';
// Import memo detail functions
import { showMemoDetail } from './modules/memo-details.js';
// Import status functions
import { showStatus, hideStatus } from './modules/status.js';
// Import memo functions
import { 
    loadMemos,
    filterMemosByTag,
    displayMemoList,
    deleteMemo
} from './modules/memos.js';

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

// Initialize UI elements
const saveChatButton = document.getElementById('saveChatButton');

// Add current filter state
let currentTagFilter = null;

// Initialize chat interface and other components
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load API keys from storage
        const result = await chrome.storage.sync.get([
            'anthropicApiKey',
            'awsAccessKey',
            'awsSecret',
            'openaiKey'
        ]);

        // Set values in form
        if (result.anthropicApiKey) {
            document.getElementById('anthropicKey').value = result.anthropicApiKey;
            await chrome.runtime.sendMessage({
                action: 'setApiKey',
                apiKey: result.anthropicApiKey
            });
        }
        if (result.awsAccessKey) {
            document.getElementById('awsAccessKey').value = result.awsAccessKey;
        }
        if (result.awsSecret) {
            document.getElementById('awsSecret').value = result.awsSecret;
        }
        if (result.openaiKey) {
            document.getElementById('openaiKey').value = result.openaiKey;
        }

        // Initialize tags
        await initializeTags();

        // Initialize tag management
        const addTagButton = document.getElementById('addTagButton');
        const addTagForm = document.getElementById('addTagForm');
        const newTagName = document.getElementById('newTagName');
        const newTagDescription = document.getElementById('newTagDescription');

        initializeTagManagement(addTagButton, addTagForm, newTagName, newTagDescription, {
            onTagsUpdated: () => {
                updateTagCounts();
            },
            showStatus
        });

        // Add event listener for showing memo detail
        document.addEventListener('showMemoDetail', (event) => {
            const { memo, tags } = event.detail;
            // Show memo detail view and hide other views
            document.getElementById('memoDetailView').classList.remove('hidden');
            document.getElementById('memoListView').classList.add('hidden');
            document.getElementById('chatPanel').classList.add('hidden');
            document.getElementById('tagsPanel').classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('hidden');
            
            // Update current memo and display it
            currentMemo = memo;
            showMemoDetail(memo, tags);
        });

        // Add event listener for memo tag updates
        document.addEventListener('memoTagUpdated', (event) => {
            const { memo, updatedMemos, message } = event.detail;
            currentMemo = memo;
            showStatus('success', message);
            updateTagCounts();
            displayMemoList(updatedMemos);
        });

        // Initialize chat interface
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

        // Add save button handler
        saveChatButton.addEventListener('click', saveCurrentChat);

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
                    
                    chatMessages = await createSystemMessage(taggedMemos, currentChatTag, chatMessages);
                    
                    // Add a system notification in the chat
                    addChatMessage('assistant', 
                        sourceToggle.checked ? 
                        "I'm now using the original source content of the memos for our conversation." :
                        "I'm now using the processed narratives and structured data from the memos for our conversation."
                    );
                }
            });
        }

        // Load initial data
        loadMemos((memos) => displayMemoList(memos, (memo, tags) => {
            // Show memo detail view and hide other views
            document.getElementById('memoDetailView').classList.remove('hidden');
            document.getElementById('memoListView').classList.add('hidden');
            document.getElementById('chatPanel').classList.add('hidden');
            document.getElementById('tagsPanel').classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('hidden');
            
            // Update current memo and display it
            currentMemo = memo;
            showMemoDetail(memo, tags);
        }));
        displaySavedChats(showStatus, addChatMessage);
        
        // Check API key after initialization
        await checkApiKey();

        // Add visibility toggle handlers
        document.querySelectorAll('.toggle-visibility').forEach(button => {
            button.addEventListener('click', () => {
                const input = button.parentElement.querySelector('input');
                const icon = button.querySelector('svg');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.innerHTML = `
                        <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
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
            initializeChatTags(selectChatTag);
            
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

        // Load tags and update counts when opening tags panel
        document.getElementById('tagsButton').addEventListener('click', async () => {
            document.getElementById('memoListView').classList.add('hidden');
            document.getElementById('memoDetailView').classList.add('hidden');
            document.getElementById('chatPanel').classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('hidden');
            document.getElementById('tagsPanel').classList.remove('hidden');
            const tagsList = document.getElementById('tagsList');
            await loadTagsFromModule(tagsList, {
                onTagClick: (tagName) => filterMemosByTag(tagName, showStatus, (memos) => displayMemoList(memos, (memo, tags) => {
                    // Show memo detail view and hide other views
                    document.getElementById('memoDetailView').classList.remove('hidden');
                    document.getElementById('memoListView').classList.add('hidden');
                    document.getElementById('chatPanel').classList.add('hidden');
                    document.getElementById('tagsPanel').classList.add('hidden');
                    document.getElementById('settingsPanel').classList.add('hidden');
                    
                    // Update current memo and display it
                    currentMemo = memo;
                    showMemoDetail(memo, tags);
                })),
                onTagDelete: async (tagName, updatedMemos, updatedTags) => {
                    // Force a complete refresh of the UI
                    await updateTagCounts();
                    
                    // Force reload memos from storage and refresh display
                    await displayMemoList(updatedMemos);
                    
                    // Update memo detail view if needed
                    if (!memoDetailView.classList.contains('hidden') && currentMemo && currentMemo.tag === tagName) {
                        currentMemo.tag = 'Untagged';
                        await showMemoDetail(currentMemo, updatedTags);
                    }
                },
                showStatus
            });
            updateTagCounts();
        });

        // Add save settings handler
        document.getElementById('saveSettings').addEventListener('click', async () => {
            const settings = {
                anthropicApiKey: document.getElementById('anthropicKey').value,
                awsAccessKey: document.getElementById('awsAccessKey').value,
                awsSecret: document.getElementById('awsSecret').value,
                openaiKey: document.getElementById('openaiKey').value
            };

            try {
                // Save to storage
                await chrome.storage.sync.set(settings);
                
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
    } catch (error) {
        console.error('Error during initialization:', error);
        showStatus('error', 'Failed to initialize extension');
    }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'selectionMade') {
        showStatus('selected');
        setSavingState();
    } else if (message.action === 'memoSaved') {
        loadMemos((memos) => displayMemoList(memos, (memo, tags) => {
            // Show memo detail view and hide other views
            document.getElementById('memoDetailView').classList.remove('hidden');
            document.getElementById('memoListView').classList.add('hidden');
            document.getElementById('chatPanel').classList.add('hidden');
            document.getElementById('tagsPanel').classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('hidden');
            
            // Update current memo and display it
            currentMemo = memo;
            showMemoDetail(memo, tags);
        }));
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

// Update memos button click handler to clear filter
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
    displayMemoList(result.memos || [], (memo, tags) => {
        // Show memo detail view and hide other views
        document.getElementById('memoDetailView').classList.remove('hidden');
        document.getElementById('memoListView').classList.add('hidden');
        document.getElementById('chatPanel').classList.add('hidden');
        document.getElementById('tagsPanel').classList.add('hidden');
        document.getElementById('settingsPanel').classList.add('hidden');
        
        // Update current memo and display it
        currentMemo = memo;
        showMemoDetail(memo, tags);
    });
    
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
        deleteMemo(currentMemo.id, showStatus, () => loadMemos((memos) => displayMemoList(memos, showMemoDetail)));
    }
});

// Select a tag for chat
async function selectChatTag(tag) {
    const result = await selectChatTagFromModule(tag, chatMessages, showStatus, addChatMessage);
    currentChatTag = result.currentChatTag;
    chatMessages = result.chatMessages;
}

// Handle sending a message
async function sendMessage() {
    chatMessages = await sendMessageModule(
        currentChatTag, 
        chatMessages, 
        addChatMessage, 
        checkApiKey
    );
}

// Make sendMessage available to onclick handlers
window.sendMessage = sendMessage;

// Save current chat
async function saveCurrentChat() {
    chatMessages = await saveCurrentChatModule(
        chatMessages, 
        currentChatTag, 
        showStatus, 
        addChatMessage, 
        initializeChatTags
    );
} 