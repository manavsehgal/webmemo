import { countWords, countJsonKeys, formatCount, showDeleteConfirmation } from './utils.js';
import { getTagStyle } from './tags.js';
import { showStatus } from './status.js';

// Load and display memos
export function loadMemos(displayMemoList) {
    chrome.storage.local.get(['memos'], (result) => {
        const memos = result.memos || [];
        displayMemoList(memos);
    });
}

// Filter memos by tag
export async function filterMemosByTag(tagName, showStatus, displayMemoList) {
    const result = await chrome.storage.local.get(['memos']);
    const memos = result.memos || [];
    
    const filteredMemos = memos.filter(memo => memo.tag === tagName);
    
    // Show notification
    showStatus('success', `Showing ${filteredMemos.length} memos tagged as "${tagName}"`);
    
    // Switch to memos list view and display filtered memos
    document.getElementById('tagsPanel').classList.add('hidden');
    document.getElementById('memoListView').classList.remove('hidden');
    displayMemoList(filteredMemos);
    
    return tagName; // Return the tag name for state management
}

// Delete memo with custom confirmation dialog
export async function deleteMemo(memoId, showStatus, loadMemos) {
    const confirmed = await showDeleteConfirmation('Are you sure you want to delete this memo? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        const updatedMemos = memos.filter(memo => memo.id !== memoId);
        
        await chrome.storage.local.set({ memos: updatedMemos });
        showStatus('delete');
        
        // If in detail view, go back to list
        if (document.getElementById('memoDetailView').classList.contains('hidden')) {
            loadMemos();
        } else {
            document.getElementById('memoDetailView').classList.add('hidden');
            document.getElementById('memoListView').classList.remove('hidden');
            loadMemos();
        }
    } catch (error) {
        console.error('Failed to delete memo:', error);
        showStatus('error', 'Could not delete memo');
    }
}

// Display memo list
export async function displayMemoList(memos, showMemoDetail) {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    
    const memoListView = document.getElementById('memoListView');
    
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
            deleteMemo(memo.id, showStatus, () => loadMemos(displayMemoList));
        });
        
        memoItemsContainer.appendChild(memoItem);
    }
}

// Function to show memo by title
export async function showMemoByTitle(title) {
    const result = await chrome.storage.local.get(['memos', 'tags']);
    const memos = result.memos || [];
    const tags = result.tags || [];
    const memo = memos.find(m => m.title === title);
    if (memo) {
        // Hide chat panel
        document.getElementById('chatPanel').classList.add('hidden');
        // Show memo detail view and hide memo list view
        document.getElementById('memoDetailView').classList.remove('hidden');
        document.getElementById('memoListView').classList.add('hidden');
        // Show memo detail
        const event = new CustomEvent('showMemoDetail', { 
            detail: { 
                memo,
                tags
            }
        });
        document.dispatchEvent(event);
    }
} 