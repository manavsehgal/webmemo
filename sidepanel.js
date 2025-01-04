// UI Elements
const memoButton = document.getElementById('memoButton');
const memoListView = document.getElementById('memoListView');
const memoDetailView = document.getElementById('memoDetailView');
const backButton = document.getElementById('backButton');
const memoDetail = document.getElementById('memoDetail');

let isHighlightMode = false;
let currentMemo = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMemos();
    checkApiKey();
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
    const result = await chrome.storage.local.get(['anthropicApiKey']);
    if (!result.anthropicApiKey) {
        const apiKey = prompt('Please enter your Anthropic API key to enable memo processing:');
        if (apiKey) {
            await chrome.runtime.sendMessage({
                action: 'setApiKey',
                apiKey
            });
            showStatus('api', 'API key saved');
        } else {
            showStatus('error', 'API key is required');
        }
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
    memoButton.textContent = 'Start Memo';
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

// Display memo list
function displayMemoList(memos) {
    memoListView.innerHTML = '';
    
    memos.forEach(memo => {
        const memoItem = document.createElement('div');
        memoItem.className = 'memo-list-item bg-white rounded-lg shadow p-4 cursor-pointer relative';
        memoItem.innerHTML = `
            <div class="flex items-center mb-2">
                <img src="${memo.favicon}" class="w-4 h-4 mr-2" alt="">
                <h3 class="font-semibold text-gray-800">${memo.title}</h3>
            </div>
            <p class="text-[0.6rem] leading-[0.9rem] text-gray-600 mb-2">${memo.summary}</p>
            <div class="flex justify-between items-center">
                <div class="text-xs text-gray-500">
                    ${new Date(memo.timestamp).toLocaleString()}
                </div>
                <button class="delete-memo text-gray-400 hover:text-red-500 ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;
        
        // Add click handler for the memo item (excluding delete button)
        memoItem.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-memo')) {
                showMemoDetail(memo);
            }
        });
        
        // Add click handler for delete button
        const deleteButton = memoItem.querySelector('.delete-memo');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMemo(memo.id);
        });
        
        memoListView.appendChild(memoItem);
    });
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
function showMemoDetail(memo) {
    currentMemo = memo;
    document.getElementById('memoTitle').textContent = memo.title;
    document.getElementById('memoTimestamp').textContent = new Date(memo.timestamp).toLocaleString();
    document.getElementById('memoSource').href = memo.url;
    document.getElementById('memoFavicon').src = memo.favicon;
    document.getElementById('memoSummary').textContent = memo.summary;
    
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