// UI Elements
const memoButton = document.getElementById('memoButton');
const memosButton = document.getElementById('memosButton');
const memoListView = document.getElementById('memoListView');
const memoDetailView = document.getElementById('memoDetailView');
const backButton = document.getElementById('backButton');
const memoDetail = document.getElementById('memoDetail');

let isHighlightMode = false;
let currentMemo = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeExtension();
    
    // Add click handler for memos button
    memosButton.addEventListener('click', () => {
        // Hide tags panel
        document.getElementById('tagsPanel').classList.add('hidden');
        
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
            selectionGuide.classList.remove('hidden');
            setTimeout(() => {
                selectionGuide.classList.remove('translate-y-2', 'opacity-0');
            }, 50);
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
        // Load API key from sync storage
        const result = await chrome.storage.sync.get(['anthropicApiKey']);
        if (result.anthropicApiKey) {
            // Set API key in background script
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

// Delete memo
async function deleteMemo(memoId) {
    if (!confirm('Are you sure you want to delete this memo?')) return;
    
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

// Create tag element with count
function createTagElement(tag) {
    const tagElement = document.createElement('div');
    tagElement.className = `group flex items-start space-x-3 p-3 bg-${tag.color}-50 rounded-lg`;
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
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <p class="text-sm text-${tag.color}-700 mt-1">${tag.description}</p>
        </div>
    `;

    // Add delete functionality
    const deleteButton = tagElement.querySelector('.delete-tag');
    deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this tag? All memos with this tag will be set to Untagged.')) {
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
        }
    });

    return tagElement;
}

// Display memo list
async function displayMemoList(memos) {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    console.log('displayMemoList tags:', tags);
    memoListView.innerHTML = '';
    
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
        
        memoListView.appendChild(memoItem);
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
        jsonDiv.textContent = JSON.stringify(memo.structuredData, null, 2);
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