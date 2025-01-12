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