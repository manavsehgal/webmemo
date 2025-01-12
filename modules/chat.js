import { countWords } from './utils.js';
import { showDeleteConfirmation } from './utils.js';

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
export function updateTokenCount(memos, useSource = false) {
    const wordCount = calculateMemosWordCount(memos, useSource);
    const tokenCount = Math.round(wordCount * 1.3);
    const tokenCountElement = document.getElementById('tokenCount');
    tokenCountElement.textContent = `This chat will cost around ${wordCount.toLocaleString()} words (${tokenCount.toLocaleString()} tokens)`;
}

// Display saved chats
export function displaySavedChats(showStatus, addChatMessage) {
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
                    loadSavedChat(chat, addChatMessage);
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
                    displaySavedChats(showStatus, addChatMessage);
                }
            });
            
            savedChatsList.appendChild(chatElement);
        });
    });
}

// Load a saved chat
export function loadSavedChat(chat, addChatMessage) {
    // Set current tag and messages
    window.currentChatTag = chat.tag;
    window.chatMessages = [...chat.messages];

    // Display messages
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    window.chatMessages.forEach(message => {
        if (message.role !== 'system') {
            addChatMessage(message.role, message.content);
        }
    });

    // Show save button
    document.getElementById('saveChatButton').classList.remove('hidden');
}

// Save current chat
export async function saveCurrentChat(chatMessages, currentChatTag, showStatus, addChatMessage, initializeChatTags) {
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
    document.getElementById('chatMessages').innerHTML = '';
    const saveButton = document.getElementById('saveChatButton');
    saveButton.classList.add('hidden');
    saveButton.classList.remove('flex');

    // Show tag selection with updated saved chats
    document.getElementById('chatInterface').classList.add('hidden');
    document.getElementById('chatTagSelection').classList.remove('hidden');
    
    // Initialize chat tags and show saved chats
    initializeChatTags();
    displaySavedChats(showStatus, addChatMessage);
    
    return [];  // Return empty array for new chatMessages
}
