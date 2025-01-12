// Import required functions
import { showStatus } from './status.js';
import { saveToStorage } from './storage.js';
import { displayMemoList, displayMemoDetail } from './ui.js';

// Load memos
export async function loadMemos() {
    try {
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        await displayMemoList(memos);
    } catch (error) {
        console.error('Failed to load memos:', error);
        showStatus('error', 'Failed to load memos');
    }
}

// Filter memos by tag
export async function filterMemosByTag(tagName) {
    try {
        const result = await chrome.storage.local.get(['memos']);
        const memos = result.memos || [];
        const filteredMemos = tagName === 'Untagged' 
            ? memos.filter(memo => !memo.tag)
            : memos.filter(memo => memo.tag === tagName);
        
        await displayMemoList(filteredMemos);
        showStatus('success', `Showing memos tagged as ${tagName}`);
    } catch (error) {
        console.error('Failed to filter memos:', error);
        showStatus('error', 'Failed to filter memos');
    }
} 