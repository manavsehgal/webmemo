// Import utility functions
import { showDeleteConfirmation } from './utils.js';

// Predefined tags with their styles and descriptions
export const predefinedTags = [
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

// Get tag color and icon
export async function getTagStyle(tagName) {
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

// Initialize tags in storage if not present
export async function initializeTags() {
    const result = await chrome.storage.local.get(['tags']);
    if (!result.tags) {
        // First time setup - store predefined tags
        await chrome.storage.local.set({ tags: predefinedTags });
    }
}

// Create tag element with count and click handler
export function createTagElement(tag, { onTagClick, onTagDelete, showStatus }) {
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
                onTagClick(tag.name);
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
            // Update memos to set deleted tag to Untagged
            const result = await chrome.storage.local.get(['memos', 'tags']);
            const memos = result.memos || [];
            
            const updatedMemos = memos.map(memo => {
                if (memo.tag === tag.name) {
                    return { ...memo, tag: 'Untagged' };
                }
                return memo;
            });

            // Remove tag from storage
            const tags = result.tags || [];
            const updatedTags = tags.filter(t => t.name !== tag.name);

            // Save updates
            await chrome.storage.local.set({ 
                tags: updatedTags,
                memos: updatedMemos
            });
            
            tagElement.remove();
            showStatus('success', 'Tag deleted');
            
            // Call the delete handler if provided
            if (onTagDelete) {
                onTagDelete(tag.name, updatedMemos, updatedTags);
            }
        } catch (error) {
            console.error('Error during tag deletion:', error);
            showStatus('error', 'Failed to delete tag');
        }
    });

    return tagElement;
}

// Load tags from storage and display them
export async function loadTags(tagsList, { onTagClick, onTagDelete, showStatus }) {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    tagsList.innerHTML = '';

    // Add all tags
    tags.forEach(tag => {
        tagsList.appendChild(createTagElement(tag, { onTagClick, onTagDelete, showStatus }));
    });
}

// Update tag counts
export async function updateTagCounts() {
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

// Initialize tag management UI
export function initializeTagManagement(addTagButton, addTagForm, newTagName, newTagDescription, { onTagsUpdated, showStatus }) {
    addTagButton.addEventListener('click', () => {
        addTagForm.classList.remove('hidden');
    });

    document.getElementById('cancelAddTag').addEventListener('click', () => {
        addTagForm.classList.add('hidden');
        newTagName.value = '';
        newTagDescription.value = '';
    });

    document.getElementById('saveNewTag').addEventListener('click', async () => {
        const name = newTagName.value.trim();
        const description = newTagDescription.value.trim();
        
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
        const tagsList = document.getElementById('tagsList');
        tagsList.appendChild(createTagElement(newTag, { showStatus }));

        // Clear form and hide it
        newTagName.value = '';
        newTagDescription.value = '';
        addTagForm.classList.add('hidden');

        showStatus('success', 'Tag created');
        
        // Call the update handler if provided
        if (onTagsUpdated) {
            onTagsUpdated();
        }
    });
}

// Initialize chat tags interface
export async function initializeChatTags(onTagSelect) {
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
            tagPill.addEventListener('click', () => onTagSelect(tag));
            tagsList.appendChild(tagPill);
        }
    });
}

// Select a tag for chat
export async function selectChatTag(tag, chatMessages, showStatus, addChatMessage) {
    const result = await chrome.storage.local.get(['memos']);
    const memos = result.memos || [];
    const taggedMemos = memos.filter(memo => memo.tag === tag.name);
    
    // Show notification
    showStatus('success', `Selected ${taggedMemos.length} memos tagged as "${tag.name}"`);
    
    // Show chat interface and hide tag selection
    document.getElementById('chatTagSelection').classList.add('hidden');
    document.getElementById('chatInterface').classList.remove('hidden');
    
    // Clear chat messages
    chatMessages = [];
    document.getElementById('chatMessages').innerHTML = '';
    
    // Add system message
    addChatMessage('assistant', `I'm ready to help you with your ${tag.name} memos. What would you like to know?`);
    
    return {
        currentChatTag: tag,
        chatMessages: chatMessages
    };
} 