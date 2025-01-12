// Import utility functions
import { countWords, countJsonKeys, formatCount, showDeleteConfirmation } from './modules/utils.js';
// Import tag functions
import { 
    getTagStyle, 
    initializeTags, 
    loadTags as loadTagsFromModule, 
    updateTagCounts,
    initializeTagManagement
} from './modules/tags.js';
// Import chat functions
import { 
    updateTokenCount,
    displaySavedChats,
    loadSavedChat,
    saveCurrentChat as saveCurrentChatModule,
    sendMessage as sendMessageModule,
    createSystemMessage,
    addChatMessage,
    selectChatTag as selectChatTagModule
} from './modules/chat.js';
// Import memo detail functions
import { showMemoDetail } from './modules/memo-details.js';

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

// Initialize
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
            currentMemo = showMemoDetail(memo, tags);
        });

        // Add event listener for memo tag updates
        document.addEventListener('memoTagUpdated', (event) => {
            const { memo, updatedMemos, message } = event.detail;
            currentMemo = memo;
            showStatus('success', message);
            updateTagCounts();
            displayMemoList(updatedMemos);
        });

        // Load initial data
        loadMemos();
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
                        <path fill-rule="evenodd" d="M3.707 2.293a1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
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
        memosButton.addEventListener('click', () => {
            // Hide other panels
            document.getElementById('tagsPanel').classList.add('hidden');
            document.getElementById('chatPanel').classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('hidden');
            
            // If in detail view, go back to list
            memoDetailView.classList.add('hidden');
            memoListView.classList.remove('hidden');
            
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

        // Load tags and update counts when opening tags panel
        document.getElementById('tagsButton').addEventListener('click', async () => {
            document.getElementById('memoListView').classList.add('hidden');
            document.getElementById('memoDetailView').classList.add('hidden');
            document.getElementById('chatPanel').classList.add('hidden');
            document.getElementById('settingsPanel').classList.add('hidden');
            document.getElementById('tagsPanel').classList.remove('hidden');
            const tagsList = document.getElementById('tagsList');
            await loadTagsFromModule(tagsList, {
                onTagClick: filterMemosByTag,
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
    } catch (error) {
        console.error('Error during initialization:', error);
        showStatus('error', 'Failed to initialize extension');
    }
});       


// Show status update
function showStatus(status, message = '') {
    const statusArea = document.getElementById('statusArea');
    const statusBadge = document.getElementById('statusBadge');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusSubtext = document.getElementById('statusSubtext');
    const selectionGuide = document.getElementById('selectionGuide');

    // Configure status
    switch (status) {
        case 'select':
            statusIcon.innerHTML = `<svg class="text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" />
            </svg>`;
            statusText.textContent = 'Selection Mode';
            statusSubtext.textContent = 'Click any content to capture';
            statusSubtext.classList.remove('hidden');
            // Remove selectionGuide display
            selectionGuide.classList.add('hidden');
            break;
        case 'selected':
            statusIcon.innerHTML = `<svg class="text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>`;
            statusText.textContent = 'Content Selected';
            statusSubtext.textContent = 'Processing will begin shortly';
            statusSubtext.classList.remove('hidden');
            selectionGuide.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => {
                selectionGuide.classList.add('hidden');
            }, 300);
            break;
        case 'processing':
            statusIcon.innerHTML = `<svg class="text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>`;
            statusText.textContent = 'Processing';
            statusSubtext.textContent = message || 'Analyzing content with AI';
            statusSubtext.classList.remove('hidden');
            selectionGuide.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => {
                selectionGuide.classList.add('hidden');
            }, 300);
            break;
        case 'success':
            statusIcon.innerHTML = `<svg class="text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>`;
            statusText.textContent = message || 'Success';
            statusSubtext.classList.add('hidden');
            break;
        case 'delete':
            statusIcon.innerHTML = `<svg class="text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`;
            statusText.textContent = 'Memo Deleted';
            statusSubtext.classList.add('hidden');
            break;
        case 'copy':
            statusIcon.innerHTML = `<svg class="text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>`;
            statusText.textContent = 'Copied';
            statusSubtext.textContent = 'Content copied to clipboard';
            statusSubtext.classList.remove('hidden');
            break;
        case 'download':
            statusIcon.innerHTML = `<svg class="text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>`;
            statusText.textContent = 'Downloaded';
            statusSubtext.textContent = 'Memo saved to downloads';
            statusSubtext.classList.remove('hidden');
            break;
        case 'api':
            statusIcon.innerHTML = `<svg class="text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd" />
            </svg>`;
            statusText.textContent = 'API Key';
            statusSubtext.textContent = message || 'API key updated';
            statusSubtext.classList.remove('hidden');
            break;
        case 'error':
            statusIcon.innerHTML = `<svg class="text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`;
            statusText.textContent = 'Error';
            statusSubtext.textContent = message || 'Something went wrong';
            statusSubtext.classList.remove('hidden');
            break;
    }

    // Show status with animation
    statusArea.style.height = 'auto';
    const height = statusArea.offsetHeight;
    statusArea.style.height = '0';
    
    // Trigger reflow
    statusArea.offsetHeight;
    
    // Animate in
    statusArea.style.height = height + 'px';
    statusBadge.classList.remove('translate-y-2', 'opacity-0');

    // Auto-hide after delay for completed actions
    if (['success', 'delete', 'copy', 'download', 'api', 'error'].includes(status)) {
        setTimeout(() => {
            // Animate out
            statusBadge.classList.add('translate-y-2', 'opacity-0');
            statusArea.style.height = '0';
        }, 3000);
    }
}

// Reset status area
function hideStatus() {
    const statusArea = document.getElementById('statusArea');
    const statusBadge = document.getElementById('statusBadge');
    const selectionGuide = document.getElementById('selectionGuide');

    statusBadge.classList.add('translate-y-2', 'opacity-0');
    statusArea.style.height = '0';
    selectionGuide.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => {
        selectionGuide.classList.add('hidden');
    }, 300);
}

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

        // Initialize other components
        await initializeTags();
        loadMemos();
        
        // Check API key after initialization
        await checkApiKey();
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

// Load and display memos
function loadMemos() {
    chrome.storage.local.get(['memos'], (result) => {
        const memos = result.memos || [];
        displayMemoList(memos);
    });
}

// Delete memo with custom confirmation dialog
async function deleteMemo(memoId) {
    const confirmed = await showDeleteConfirmation('Are you sure you want to delete this memo? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        const updatedMemos = memos.filter(memo => memo.id !== memoId);
        
        await chrome.storage.local.set({ memos: updatedMemos });
        showStatus('delete');
        
        // If in detail view, go back to list
        if (memoDetailView.classList.contains('hidden')) {
            loadMemos();
        } else {
            memoDetailView.classList.add('hidden');
            memoListView.classList.remove('hidden');
            loadMemos();
        }
    } catch (error) {
        console.error('Failed to delete memo:', error);
        showStatus('error', 'Could not delete memo');
    }
}

// Filter memos by tag
async function filterMemosByTag(tagName) {
    const result = await chrome.storage.local.get(['memos']);
    const memos = result.memos || [];
    
    currentTagFilter = tagName;
    const filteredMemos = memos.filter(memo => memo.tag === tagName);
    
    // Show notification
    showStatus('success', `Showing ${filteredMemos.length} memos tagged as "${tagName}"`);
    
    // Switch to memos list view and display filtered memos
    document.getElementById('tagsPanel').classList.add('hidden');
    document.getElementById('memoListView').classList.remove('hidden');
    displayMemoList(filteredMemos);
}

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

// Display memo list
async function displayMemoList(memos) {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    console.log('displayMemoList tags:', tags);
    
    // Keep the title and add a container for memo items
    const titleHtml = `
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold text-gray-800">Memos</h2>
        </div>
    `;
    const memoItemsContainer = document.createElement('div');
    memoItemsContainer.className = 'space-y-4';
    
    memoListView.innerHTML = titleHtml;
    memoListView.appendChild(memoItemsContainer);
    
    for (const memo of memos) {
        const tagStyle = await getTagStyle(memo.tag || 'Untagged');
        console.log('displayMemoList memo.tag || Untagged:', memo.tag || 'Untagged');
        const memoItem = document.createElement('div');
        memoItem.className = 'memo-list-item bg-white rounded-lg shadow p-4 cursor-pointer relative';
        memoItem.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <img src="${memo.favicon}" class="w-4 h-4 mr-2" alt="">
                    <h3 class="font-semibold text-gray-800">${memo.title}</h3>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs px-2 py-1 rounded-full bg-${tagStyle.color}-100 text-${tagStyle.color}-700">
                        ${memo.tag || 'Untagged'}
                    </span>
                    <button class="delete-memo text-gray-400 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            <p class="text-[0.6rem] leading-[0.9rem] text-gray-600 mb-2">${memo.summary}</p>
            <div class="text-xs text-gray-500">
                ${new Date(memo.timestamp).toLocaleString()}
            </div>
        `;
        
        // Add click handler for the memo item (excluding delete button)
        memoItem.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-memo')) {
                showMemoDetail(memo, tags);
            }
        });
        
        // Add click handler for delete button
        const deleteButton = memoItem.querySelector('.delete-memo');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMemo(memo.id);
        });
        
        memoItemsContainer.appendChild(memoItem);
    }
}

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
    const result = await selectChatTagModule(tag, chatMessages, showStatus, addChatMessage);
    currentChatTag = result.currentChatTag;
    chatMessages = result.chatMessages;
}

// Chat input handlers
document.addEventListener('DOMContentLoaded', () => {
    // Remove send button event listener since we removed the button
    const sendButton = document.getElementById('sendMessage');
    if (sendButton) {
        sendButton.remove();
    }

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

// Initialize chat when opening chat panel
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