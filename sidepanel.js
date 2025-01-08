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
                
                await createSystemMessage(taggedMemos);
                
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
    document.addEventListener('DOMContentLoaded', () => {
        // Add handlers for all toggle visibility buttons
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
    });
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

// Show delete confirmation dialog
async function showDeleteConfirmation(message) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <div class="flex justify-center mb-4">
                <img src="icons/webmemo-logo-128.png" alt="WebMemo Logo" class="w-32 h-32">
            </div>
            <h3 class="text-lg font-semibold text-gray-900 text-center">Delete Confirmation</h3>
            <p class="text-sm text-gray-600 text-center">${message}</p>
            <div class="flex justify-center space-x-3 mt-4">
                <button class="cancel-delete px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                    Cancel
                </button>
                <button class="confirm-delete px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200">
                    Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    return new Promise((resolve) => {
        dialog.querySelector('.cancel-delete').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(false);
        });
        
        dialog.querySelector('.confirm-delete').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(true);
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                resolve(false);
            }
        });
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

// Get tag color and icon
async function getTagStyle(tagName) {
    const defaultStyle = {
        color: 'gray',
        icon: '<path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />'
    };

    if (tagName === 'Untagged') {
        return defaultStyle;
    }

    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    const tag = tags.find(t => t.name === tagName);
    return tag || defaultStyle;
}

// Update tag counts
async function updateTagCounts() {
    const result = await chrome.storage.local.get(['memos', 'tags']);
    const memos = result.memos || [];
    const tags = result.tags || [];

    // Count memos for each tag
    const counts = memos.reduce((acc, memo) => {
        const tag = memo.tag || 'Untagged';
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});

    // Update UI
    tags.forEach(tag => {
        const tagElement = document.querySelector(`[data-tag-name="${tag.name}"]`);
        if (tagElement) {
            const countElement = tagElement.querySelector('.tag-count');
            countElement.textContent = counts[tag.name] || 0;
        }
    });

    // Update Untagged count
    const untaggedElement = document.querySelector('[data-tag-name="Untagged"]');
    if (untaggedElement) {
        const countElement = untaggedElement.querySelector('.tag-count');
        countElement.textContent = counts['Untagged'] || 0;
    }
}

// Create tag element with count and click handler
function createTagElement(tag) {
    const tagElement = document.createElement('div');
    tagElement.className = `group flex items-start space-x-3 p-3 bg-${tag.color}-50 rounded-lg hover:bg-${tag.color}-100 transition-colors duration-200`;
    tagElement.setAttribute('data-tag-name', tag.name);
    tagElement.innerHTML = `
        <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-${tag.color}-500" viewBox="0 0 20 20" fill="currentColor">
                ${tag.icon}
            </svg>
        </div>
        <div class="flex-grow">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="font-medium text-${tag.color}-900">${tag.name}</span>
                    <span class="tag-count text-sm text-${tag.color}-600">0</span>
                </div>
                <button class="text-${tag.color}-400 hover:text-${tag.color}-600 delete-tag">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <p class="text-sm text-${tag.color}-700 mt-1">${tag.description}</p>
        </div>
    `;

    // Add click handler for tag filtering
    tagElement.addEventListener('click', (e) => {
        // Ignore if delete button was clicked
        if (!e.target.closest('.delete-tag')) {
            const count = parseInt(tagElement.querySelector('.tag-count').textContent);
            if (count > 0) {
                tagElement.classList.add('cursor-pointer');
                filterMemosByTag(tag.name);
            }
        }
    });

    // Update cursor style based on memo count
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('tag-count')) {
                const count = parseInt(mutation.target.textContent);
                if (count > 0) {
                    tagElement.classList.add('cursor-pointer');
                } else {
                    tagElement.classList.remove('cursor-pointer');
                }
            }
        });
    });

    observer.observe(tagElement.querySelector('.tag-count'), { 
        characterData: true, 
        childList: true,
        subtree: true 
    });

    // Add delete functionality
    const deleteButton = tagElement.querySelector('.delete-tag');
    deleteButton.addEventListener('click', async () => {
        const confirmed = await showDeleteConfirmation('Are you sure you want to delete this tag? All memos with this tag will be set to Untagged.');
        if (!confirmed) return;

        try {
            console.log('Deleting tag:', tag.name);
            
            // Update memos to set deleted tag to Untagged
            const result = await chrome.storage.local.get(['memos', 'tags']);
            const memos = result.memos || [];
            console.log('Before update - Memos:', memos);
            
            const updatedMemos = memos.map(memo => {
                if (memo.tag === tag.name) {
                    console.log('Updating memo tag from', memo.tag, 'to Untagged');
                    return { ...memo, tag: 'Untagged' };
                }
                return memo;
            });
            console.log('After update - Memos:', updatedMemos);

            // Remove tag from storage
            const tags = result.tags || [];
            const updatedTags = tags.filter(t => t.name !== tag.name);

            // Save updates
            await chrome.storage.local.set({ 
                tags: updatedTags,
                memos: updatedMemos
            });
            
            // Verify storage update
            const verifyResult = await chrome.storage.local.get(['memos']);
            console.log('Storage verification - Memos:', verifyResult.memos);
            
            tagElement.remove();
            showStatus('success', 'Tag deleted', 'The tag has been removed');
            
            // Force a complete refresh of the UI
            await updateTagCounts();
            
            // Force reload memos from storage and refresh display
            const refreshResult = await chrome.storage.local.get(['memos']);
            await displayMemoList(refreshResult.memos || []);
            
            // Update memo detail view if needed
            if (!memoDetailView.classList.contains('hidden') && currentMemo && currentMemo.tag === tag.name) {
                currentMemo.tag = 'Untagged';
                await showMemoDetail(currentMemo, updatedTags);
            }
            
        } catch (error) {
            console.error('Error during tag deletion:', error);
            showStatus('error', 'Failed to delete tag');
        }
    });

    return tagElement;
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

// Count words in text and HTML
function countWords(html) {
    if (!html) return 0;
    
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Get text content and count words
    const text = temp.textContent || temp.innerText || '';
    const words = text.trim()
        .replace(/[\r\n\t]+/g, ' ')     // Replace newlines and tabs with spaces
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .split(' ')
        .filter(word => word.length > 0);
    
    // Count HTML tags (excluding empty/self-closing tags)
    const tagMatches = html.match(/<\/?[a-z][^>]*>/gi) || [];
    const tagCount = tagMatches.filter(tag => !tag.match(/<[^>]+\/>/)).length;
    
    console.log('Word count details:', {
        text: text.substring(0, 100) + '...',  // Log first 100 chars
        wordCount: words.length,
        tagCount,
        totalCount: words.length + tagCount
    });
    
    return words.length + tagCount;
}

// Count unique keys in JSON object recursively
function countJsonKeys(obj) {
    if (!obj) return 0;
    
    const uniqueKeys = new Set();
    
    function traverse(o) {
        if (Array.isArray(o)) {
            o.forEach(item => {
                if (item && typeof item === 'object') {
                    traverse(item);
                }
            });
        } else if (typeof o === 'object') {
            Object.keys(o).forEach(key => {
                uniqueKeys.add(key);
                if (o[key] && typeof o[key] === 'object') {
                    traverse(o[key]);
                }
            });
        }
    }
    
    traverse(obj);
    return uniqueKeys.size;
}

// Format count
function formatCount(count, type = 'words') {
    if (type === 'keys') {
        return count === 1 ? '1 key' : `${count} keys`;
    }
    const formattedCount = count.toLocaleString();  // Add thousands separators
    return count === 1 ? '1 word' : `${formattedCount} words`;
}

// Show memo detail
async function showMemoDetail(memo, tags) {
    currentMemo = memo;
    const tagStyle = await getTagStyle(memo.tag || 'Untagged');

    // If tags not provided, fetch them
    if (!tags) {
        const result = await chrome.storage.local.get(['tags']);
        tags = result.tags || [];
    }

    document.getElementById('memoTitle').textContent = memo.title;
    document.getElementById('memoTimestamp').textContent = new Date(memo.timestamp).toLocaleString();
    document.getElementById('memoSource').href = memo.url;
    document.getElementById('memoFavicon').src = memo.favicon;
    document.getElementById('memoSummary').textContent = memo.summary;

    // Add tag display to metadata section
    const tagDisplay = document.createElement('div');
    tagDisplay.className = 'flex items-center space-x-2 mb-4';
    
    // Create tag selector dropdown styled as a button
    const tagSelector = document.createElement('select');
    tagSelector.className = 'appearance-none bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer text-sm';
    tagSelector.innerHTML = `
        <option value="Untagged" ${memo.tag === 'Untagged' ? 'selected' : ''}>Untagged</option>
        ${tags.map(tag => `
            <option value="${tag.name}" ${memo.tag === tag.name ? 'selected' : ''}>
                ${tag.name}
            </option>
        `).join('')}
    `;

    // Create a styled wrapper for the select
    const selectWrapper = document.createElement('div');
    const wrapperColor = tagStyle.color;
    selectWrapper.className = `relative flex items-center px-3 py-1.5 rounded-full bg-${wrapperColor}-100 text-${wrapperColor}-700 hover:bg-${wrapperColor}-200 transition-colors duration-200`;
    
    // Add icon based on current tag
    selectWrapper.innerHTML = `
        <svg class="w-4 h-4 mr-2 text-${wrapperColor}-500" viewBox="0 0 20 20" fill="currentColor">
            ${tagStyle.icon}
        </svg>
    `;
    
    // Add dropdown icon
    const dropdownIcon = document.createElement('div');
    dropdownIcon.className = `ml-2 text-${wrapperColor}-500`;
    dropdownIcon.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
    `;

    selectWrapper.appendChild(tagSelector);
    selectWrapper.appendChild(dropdownIcon);

    tagDisplay.appendChild(selectWrapper);

    // Handle tag changes
    tagSelector.addEventListener('change', async (e) => {
        const newTag = e.target.value;
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        const updatedMemos = memos.map(m => {
            if (m.id === memo.id) {
                return { ...m, tag: newTag };
            }
            return m;
        });
        await chrome.storage.local.set({ memos: updatedMemos });
        currentMemo.tag = newTag;
        
        // Update the wrapper styling
        const newTagStyle = await getTagStyle(newTag);
        const newColor = newTagStyle.color;
        selectWrapper.className = `relative flex items-center px-3 py-1.5 rounded-full bg-${newColor}-100 text-${newColor}-700 hover:bg-${newColor}-200 transition-colors duration-200`;
        selectWrapper.querySelector('svg').className = `w-4 h-4 mr-2 text-${newColor}-500`;
        dropdownIcon.className = `ml-2 text-${newColor}-500`;
        
        // Update UI
        showStatus('success', 'Tag updated');
        updateTagCounts();
        
        // Refresh memo list in background
        displayMemoList(updatedMemos);
    });

    // Remove any existing tag display and add the new one
    const existingTagDisplay = document.querySelector('.memo-tag-display');
    if (existingTagDisplay) {
        existingTagDisplay.remove();
    }
    tagDisplay.classList.add('memo-tag-display');
    const metadataSection = document.querySelector('.bg-gray-50.p-3.rounded-lg.mb-4');
    metadataSection.parentNode.insertBefore(tagDisplay, metadataSection);
    
    // Calculate and display metadata stats
    const sourceWords = countWords(memo.sourceHtml);
    document.getElementById('memoSourceSize').textContent = formatCount(sourceWords);
    
    const narrativeWords = countWords(memo.narrative);
    document.getElementById('memoNarrativeSize').textContent = formatCount(narrativeWords);
    
    let structuredData;
    try {
        structuredData = typeof memo.structuredData === 'string' 
            ? JSON.parse(memo.structuredData) 
            : memo.structuredData;
    } catch (e) {
        structuredData = null;
    }
    
    const keyCount = countJsonKeys(structuredData);
    document.getElementById('memoDataFields').textContent = formatCount(keyCount, 'keys');
    
    const narrativeDiv = document.getElementById('memoNarrative');
    const jsonDiv = document.getElementById('memoJson');
    
    if (memo.narrative) {
        narrativeDiv.innerHTML = memo.narrative;
        narrativeDiv.classList.remove('hidden');
    } else {
        narrativeDiv.classList.add('hidden');
    }
    
    if (memo.structuredData) {
        // Ensure we're working with an object
        const dataToDisplay = typeof memo.structuredData === 'string' 
            ? JSON.parse(memo.structuredData) 
            : memo.structuredData;
        jsonDiv.textContent = JSON.stringify(dataToDisplay, null, 2);
        jsonDiv.classList.remove('hidden');
    } else {
        jsonDiv.classList.add('hidden');
    }
    
    memoListView.classList.add('hidden');
    memoDetailView.classList.remove('hidden');
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

// Tag Management
const predefinedTags = [
    {
        name: 'Shopping',
        description: 'Shopping discovery, research, trends, deals, comparisons, reviews, and recommendations.',
        color: 'pink',
        icon: '<path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />'
    },
    {
        name: 'Travel',
        description: 'Travel planning, research, deals, and recommendations.',
        color: 'blue',
        icon: '<path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />'
    },
    {
        name: 'Health',
        description: 'Health research, tips, and advice.',
        color: 'green',
        icon: '<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />'
    },
    {
        name: 'Technology',
        description: 'Technology research, tips, advice, learning, products, companies, and trends.',
        color: 'purple',
        icon: '<path fill-rule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />'
    },
    {
        name: 'Investing',
        description: 'Investing research, tips, and advice.',
        color: 'yellow',
        icon: '<path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />'
    },
    {
        name: 'Entertainment',
        description: 'Restaurants, movies, music, books, and events.',
        color: 'red',
        icon: '<path d="M13.92 3.845a19.361 19.361 0 01-6.85 1.335c-2.354.068-4.73-.108-7.07-.577v11.543c2.34.47 4.716.645 7.07.577 2.354-.068 4.73-.344 7.07-.577V3.845z" />'
    },
    {
        name: 'Education',
        description: 'Learning, courses, and resources.',
        color: 'indigo',
        icon: '<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />'
    }
];

// Initialize tags in storage if not present
async function initializeTags() {
    const result = await chrome.storage.local.get(['tags']);
    if (!result.tags) {
        // First time setup - store predefined tags
        await chrome.storage.local.set({ tags: predefinedTags });
    }
}

// Load tags from storage and display them
async function loadTags() {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = '';

    // Add all tags
    tags.forEach(tag => {
        tagsList.appendChild(createTagElement(tag));
    });
}

// Load tags and update counts when opening tags panel
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
    
    if (!name) {
        showStatus('error', 'Tag name is required');
        return;
    }

    // Generate a random color from a predefined set
    const colors = ['pink', 'blue', 'green', 'purple', 'yellow', 'red', 'indigo', 'teal', 'orange', 'cyan'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newTag = {
        name,
        description,
        color: randomColor,
        icon: '<path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />'
    };

    // Save to storage
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    tags.push(newTag);
    await chrome.storage.local.set({ tags });

    // Add to UI
    document.getElementById('tagsList').appendChild(createTagElement(newTag));

    // Clear form and hide it
    document.getElementById('newTagName').value = '';
    document.getElementById('newTagDescription').value = '';
    document.getElementById('addTagForm').classList.add('hidden');

    showStatus('success', 'Tag created', 'New tag has been added');
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
    currentChatTag = tag;
    const result = await chrome.storage.local.get(['memos']);
    const memos = result.memos || [];
    
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
    await createSystemMessage(taggedMemos);
}

// Create system message based on toggle state
async function createSystemMessage(taggedMemos) {
    const useSource = document.getElementById('sourceToggle').checked;
    
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

    const systemMessage = `You are a helpful assistant with access to a collection of memos tagged as "${currentChatTag.name}". 
    
    Refer to this associated tag and description when responding to user prompt:
    Tag: ${currentChatTag.name}
    Description: ${currentChatTag.description}
    
    When responding to user queries, prioritize information from these memos:
    
    ${memoContext}
    
    ${useSource ? `You are now working with the original source content of the memos. Use this raw content to provide detailed, accurate responses based on the original material.` : `You are working with processed narratives and structured data from the memos. Use this curated content to provide focused, organized responses.`}
    
    You can also use your general knowledge to provide additional context and insights beyond what's in the memos.
    Always be clear when you're referencing memo content versus providing supplementary information.
    
    When you reference information from a memo, cite it using its title in square brackets like this: [Title of Memo].
    If you reference multiple memos, cite each one where its information is used.
    Always cite memos when you use their information in your response.`;

    // Update chat messages with new system message
    chatMessages = chatMessages.filter(msg => msg.role !== 'system');
    chatMessages.unshift({ role: 'system', content: systemMessage });
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
        // Hide chat interface
        document.getElementById('chatPanel').classList.add('hidden');
        // Show memo detail
        showMemoDetail(memo);
    }
}

// Make showMemoByTitle available to onclick handlers
window.showMemoByTitle = showMemoByTitle;

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

// Make sendMessage available to onclick handlers
window.sendMessage = sendMessage;

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
    await chrome.storage.local.set({ savedChats });

    // Clear current chat
    chatMessages = [];
    document.getElementById('chatMessages').innerHTML = '';
    const saveButton = document.getElementById('saveChatButton');
    saveButton.classList.add('hidden');
    saveButton.classList.remove('flex');

    // Show tag selection with updated saved chats
    document.getElementById('chatInterface').classList.add('hidden');
    document.getElementById('chatTagSelection').classList.remove('hidden');
    
    // Initialize chat tags and show saved chats
    initializeChatTags();
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
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h4 class="text-sm font-medium text-gray-800">${chat.title}</h4>
                        <p class="text-xs text-gray-500 mt-1">
                            ${new Date(chat.timestamp).toLocaleString()}
                        </p>
                    </div>
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
}

// Calculate total word count for memos
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

// Update token count display
function updateTokenCount(memos, useSource = false) {
    const wordCount = calculateMemosWordCount(memos, useSource);
    const tokenCount = Math.round(wordCount * 1.3);
    const tokenCountElement = document.getElementById('tokenCount');
    tokenCountElement.textContent = `This chat will cost around ${wordCount.toLocaleString()} words (${tokenCount.toLocaleString()} tokens)`;
} 