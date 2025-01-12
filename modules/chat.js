import { countWords } from './utils.js';
import { showDeleteConfirmation } from './utils.js';
import { showMemoByTitle } from './memos.js';

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

// Create system message based on toggle state
export async function createSystemMessage(taggedMemos, currentChatTag, chatMessages) {
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
    const updatedMessages = chatMessages.filter(msg => msg.role !== 'system');
    updatedMessages.unshift({ role: 'system', content: systemMessage });
    return updatedMessages;
}

// Add a message to the chat
export function addChatMessage(role, content) {
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

// Send a message in the chat
export async function sendMessage(currentChatTag, chatMessages, addChatMessage, checkApiKey) {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || !currentChatTag) return chatMessages;

    // Clear input
    input.value = '';
    input.style.height = '4.5rem';

    // Add user message
    addChatMessage('user', message);
    const updatedMessages = [...chatMessages, { role: 'user', content: message }];

    // Show typing indicator
    document.getElementById('chatTypingIndicator').classList.remove('hidden');
    input.disabled = true;  // Disable input while processing

    try {
        // Send message through background script
        const response = await chrome.runtime.sendMessage({
            action: 'chatMessage',
            messages: updatedMessages
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to get response');
        }

        // Add assistant message
        addChatMessage('assistant', response.reply);
        updatedMessages.push({ role: 'assistant', content: response.reply });

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

    return updatedMessages;
}

// Select a tag for chat
export async function selectChatTag(tag, chatMessages, showStatus, addChatMessage) {
    // Set current tag
    const currentChatTag = tag;
    const result = await chrome.storage.local.get(['memos', 'savedChats']);
    const memos = result.memos || [];
    const savedChats = result.savedChats || [];
    
    // Filter memos by tag
    const taggedMemos = memos.filter(memo => memo.tag === tag.name);
    
    // Show chat interface
    document.getElementById('chatTagSelection').classList.add('hidden');
    document.getElementById('chatInterface').classList.remove('hidden');
    
    // Set chat intro
    document.getElementById('chatIntro').textContent = 
        `I am ready to chat about memos tagged as ${tag.name} (${tag.description})...`;
    
    // Reset chat
    let updatedMessages = [];
    document.getElementById('chatMessages').innerHTML = '';
    
    // Reset source toggle and update token count
    const sourceToggle = document.getElementById('sourceToggle');
    sourceToggle.checked = false;
    updateTokenCount(taggedMemos, false);
    
    // Create system message
    updatedMessages = await createSystemMessage(taggedMemos, currentChatTag, updatedMessages);

    // Filter and display saved chats for this tag
    const taggedSavedChats = savedChats.filter(chat => chat.tag.name === tag.name);
    if (taggedSavedChats.length > 0) {
        const chatToolbar = document.querySelector('.chat-toolbar');
        
        // Clear any existing saved chats section
        const existingSavedChats = chatToolbar.querySelector('.saved-chats-section');
        if (existingSavedChats) {
            existingSavedChats.remove();
        }
        
        const savedChatsSection = document.createElement('div');
        savedChatsSection.className = 'mt-4 pt-4 border-t saved-chats-section';
        savedChatsSection.innerHTML = `
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Previous Chats</h3>
            <div class="space-y-2">
                ${taggedSavedChats.map(chat => `
                    <div class="flex items-center justify-between bg-white rounded-lg p-2 hover:bg-gray-50 transition-colors duration-200 cursor-pointer saved-chat-item">
                        <div class="flex-grow">
                            <p class="text-sm text-gray-800">${chat.title}</p>
                            <p class="text-xs text-gray-500">${new Date(chat.timestamp).toLocaleString()}</p>
                        </div>
                        <button class="delete-saved-chat text-gray-400 hover:text-red-500 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers for saved chats
        savedChatsSection.querySelectorAll('.saved-chat-item').forEach((item, index) => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-saved-chat')) {
                    loadSavedChat(taggedSavedChats[index], addChatMessage);
                    document.getElementById('chatTagSelection').classList.add('hidden');
                    document.getElementById('chatInterface').classList.remove('hidden');
                }
            });
        });

        // Add click handlers for delete buttons
        savedChatsSection.querySelectorAll('.delete-saved-chat').forEach((button, index) => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showDeleteConfirmation('Are you sure you want to delete this saved chat?');
                if (confirmed) {
                    const result = await chrome.storage.local.get(['savedChats']);
                    const savedChats = result.savedChats || [];
                    const updatedChats = savedChats.filter(c => c.id !== taggedSavedChats[index].id);
                    await chrome.storage.local.set({ savedChats: updatedChats });
                    showStatus('success', 'Chat deleted');
                    displaySavedChats(showStatus, addChatMessage);
                }
            });
        });

        chatToolbar.appendChild(savedChatsSection);
    }

    return { currentChatTag, chatMessages: updatedMessages };
}
