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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'memoSaved') {
        loadMemos(); // Refresh the memo list
        showToast('Memo saved successfully!', 'success');
        resetMemoButton();
    } else if (message.action === 'error') {
        showToast(message.error, 'error');
        resetMemoButton();
        if (message.error.includes('API key not set')) {
            checkApiKey();
        }
    } else if (message.action === 'savingMemo') {
        setSavingState();
    }
});

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        color: white;
        ${type === 'success' ? 'background: #10B981;' : 'background: #EF4444;'}
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

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
            showToast('API key set successfully!', 'success');
        } else {
            showToast('API key is required for memo processing', 'error');
        }
    }
}

// Set button to saving state
function setSavingState() {
    memoButton.textContent = 'Saving...';
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
}

// Toggle highlight mode
memoButton.addEventListener('click', async () => {
    if (memoButton.disabled) return;
    
    // Check for API key before enabling highlight mode
    const result = await chrome.storage.local.get(['anthropicApiKey']);
    if (!result.anthropicApiKey) {
        showToast('Please set your API key first', 'error');
        checkApiKey();
        return;
    }

    isHighlightMode = !isHighlightMode;
    if (isHighlightMode) {
        memoButton.textContent = 'Cancel';
        memoButton.classList.remove('bg-blue-500');
        memoButton.classList.add('bg-red-500');
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
        showToast('Memo deleted successfully', 'success');
        
        // If in detail view, go back to list
        if (!memoListView.classList.contains('hidden')) {
            loadMemos();
        } else {
            memoDetailView.classList.add('hidden');
            memoListView.classList.remove('hidden');
            loadMemos();
        }
    } catch (error) {
        console.error('Failed to delete memo:', error);
        showToast('Failed to delete memo', 'error');
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
            <p class="text-sm text-gray-600 mb-2">${memo.summary}</p>
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
    
    // Count HTML tags
    const tagCount = temp.getElementsByTagName('*').length;
    
    // Get text content and count words
    const text = temp.textContent || temp.innerText;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    return tagCount + wordCount;
}

// Format word count
function formatCount(count, type = 'words') {
    if (type === 'fields') {
        return count === 1 ? '1 field' : `${count} fields`;
    }
    return count === 1 ? '1 word' : `${count} words`;
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
    
    const dataFieldsCount = memo.structuredData ? Object.keys(memo.structuredData).length : 0;
    document.getElementById('memoDataFields').textContent = formatCount(dataFieldsCount, 'fields');
    
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
        .then(() => showToast('Content copied to clipboard!', 'success'))
        .catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy content', 'error');
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
    showToast('Memo downloaded successfully', 'success');
});

// Delete button handler
document.getElementById('deleteButton').addEventListener('click', () => {
    if (currentMemo) {
        deleteMemo(currentMemo.id);
    }
}); 