// Import required functions
import { showStatus } from './status.js';
import { saveToStorage, showDeleteConfirmation } from './storage.js';
import { filterMemosByTag } from './memos.js';
import { getTagStyle } from './ui.js';

// Predefined tags with icons and colors
export const predefinedTags = [
    {
        name: 'Research',
        description: 'Research papers, articles, and studies',
        color: 'purple',
        icon: '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />'
    },
    {
        name: 'Article',
        description: 'News articles, blog posts, and online publications',
        color: 'green',
        icon: '<path fill-rule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clip-rule="evenodd" />'
    },
    {
        name: 'Tutorial',
        description: 'How-to guides, tutorials, and educational content',
        color: 'purple',
        icon: '<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />'
    },
    {
        name: 'Reference',
        description: 'Documentation, API references, and technical specifications',
        color: 'yellow',
        icon: '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />'
    },
    {
        name: 'Code',
        description: 'Code snippets, examples, and programming resources',
        color: 'red',
        icon: '<path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />'
    }
];

// Initialize tags
export async function initializeTags() {
    const result = await chrome.storage.local.get(['tags']);
    const existingTags = result.tags || [];
    
    // If no tags exist, initialize with predefined tags
    if (existingTags.length === 0) {
        await saveToStorage('tags', predefinedTags);
        showStatus('success', 'Tags initialized');
    }
    
    await loadTags();
}

// Load and display tags
export async function loadTags() {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    
    const tagsPanel = document.getElementById('tagsPanel');
    const tagsList = document.createElement('div');
    tagsList.className = 'space-y-2';
    
    // Add title and new tag button
    const titleSection = document.createElement('div');
    titleSection.className = 'flex justify-between items-center mb-4';
    titleSection.innerHTML = `
        <h2 class="text-lg font-semibold text-gray-800">Tags</h2>
        <button id="addTagButton" class="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200">
            Add Tag
        </button>
    `;
    
    // Create tag list
    for (const tag of tags) {
        const tagElement = await createTagElement(tag);
        tagsList.appendChild(tagElement);
    }
    
    // Clear existing content and add new elements
    tagsPanel.innerHTML = '';
    tagsPanel.appendChild(titleSection);
    tagsPanel.appendChild(tagsList);
    
    // Add new tag form (hidden by default)
    const newTagForm = document.createElement('div');
    newTagForm.id = 'newTagForm';
    newTagForm.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    newTagForm.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h3>
            <div class="space-y-4">
                <div>
                    <label for="tagName" class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="tagName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label for="tagDescription" class="block text-sm font-medium text-gray-700">Description</label>
                    <input type="text" id="tagDescription" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div>
                    <label for="tagColor" class="block text-sm font-medium text-gray-700">Color</label>
                    <select id="tagColor" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="gray">Gray</option>
                        <option value="red">Red</option>
                        <option value="yellow">Yellow</option>
                        <option value="green">Green</option>
                        <option value="blue">Blue</option>
                        <option value="indigo">Indigo</option>
                        <option value="purple">Purple</option>
                        <option value="pink">Pink</option>
                    </select>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="cancelAddTag" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                        Cancel
                    </button>
                    <button id="saveNewTag" class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-200">
                        Save
                    </button>
                </div>
            </div>
        </div>
    `;
    
    tagsPanel.appendChild(newTagForm);
    
    // Add event listeners
    document.getElementById('addTagButton').addEventListener('click', () => {
        newTagForm.classList.remove('hidden');
    });
    
    document.getElementById('cancelAddTag').addEventListener('click', () => {
        newTagForm.classList.add('hidden');
        document.getElementById('tagName').value = '';
        document.getElementById('tagDescription').value = '';
        document.getElementById('tagColor').value = 'gray';
    });
    
    document.getElementById('saveNewTag').addEventListener('click', async () => {
        const name = document.getElementById('tagName').value.trim();
        const description = document.getElementById('tagDescription').value.trim();
        const color = document.getElementById('tagColor').value;
        
        if (name) {
            await addNewTag(name, description, color);
            newTagForm.classList.add('hidden');
            document.getElementById('tagName').value = '';
            document.getElementById('tagDescription').value = '';
            document.getElementById('tagColor').value = 'gray';
        }
    });
    
    // Update tag counts
    await updateTagCounts();
}

// Create tag element
export async function createTagElement(tag) {
    const result = await chrome.storage.local.get(['memos']);
    const memos = result.memos || [];
    const tagCount = memos.filter(memo => memo.tag === tag.name).length;
    
    const tagElement = document.createElement('div');
    // Only add cursor-pointer if there are memos
    tagElement.className = `tag-item flex items-center justify-between p-2 rounded-lg bg-${tag.color}-50 hover:bg-${tag.color}-100 transition-colors duration-200 ${tagCount > 0 ? 'cursor-pointer' : ''}`;
    tagElement.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="w-5 h-5 flex items-center justify-center">
                <svg class="w-5 h-5 text-${tag.color}-500" viewBox="0 0 20 20" fill="currentColor">
                    ${tag.icon || predefinedTags[0].icon}
                </svg>
            </div>
            <div class="flex-grow">
                <div class="font-medium text-${tag.color}-900">${tag.name}</div>
                <div class="text-sm text-${tag.color}-600">${tag.description || ''}</div>
            </div>
        </div>
        <div class="flex items-center space-x-3">
            <span class="tag-count text-xs px-2 py-0.5 rounded-full bg-${tag.color}-100 text-${tag.color}-700">${tagCount} memo${tagCount === 1 ? '' : 's'}</span>
            <button class="delete-tag p-1 text-gray-400 hover:text-red-500 transition-colors duration-200">
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    `;
    
    // Add click handler only if there are memos
    if (tagCount > 0) {
        tagElement.addEventListener('click', async (e) => {
            // Don't filter if clicking delete button
            if (e.target.closest('.delete-tag')) {
                e.stopPropagation();
                return;
            }
            // Hide tags panel and show memo list
            document.getElementById('tagsPanel').classList.add('hidden');
            document.getElementById('memoListView').classList.remove('hidden');
            // Filter and display memos
            await filterMemosByTag(tag.name);
        });
    }

    // Add delete handler
    const deleteButton = tagElement.querySelector('.delete-tag');
    deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (tagCount > 0) {
            showStatus('error', 'Cannot delete tag with associated memos');
            return;
        }
        const confirmed = await showDeleteConfirmation('Are you sure you want to delete this tag?');
        if (confirmed) {
            const result = await chrome.storage.local.get(['tags']);
            const tags = result.tags || [];
            const updatedTags = tags.filter(t => t.name !== tag.name);
            await saveToStorage('tags', updatedTags);
            await loadTags();
            showStatus('success', 'Tag deleted');
        }
    });
    
    return tagElement;
}

// Add new tag
export async function addNewTag(name, description, color) {
    const result = await chrome.storage.local.get(['tags']);
    const tags = result.tags || [];
    
    // Check if tag already exists
    if (tags.some(tag => tag.name === name)) {
        showStatus('error', 'Tag already exists');
        return;
    }
    
    // Create new tag
    const newTag = {
        name,
        description,
        color,
        icon: predefinedTags[0].icon // Use default icon for now
    };
    
    // Add to tags array and save
    tags.push(newTag);
    await saveToStorage('tags', tags);
    
    // Reload tags
    await loadTags();
    showStatus('success', 'Tag added successfully');
}

// Update tag counts
export async function updateTagCounts() {
    const result = await chrome.storage.local.get(['memos', 'tags']);
    const memos = result.memos || [];
    const tags = result.tags || [];
    
    // Count memos for each tag
    const tagCounts = {};
    memos.forEach(memo => {
        const tag = memo.tag || 'Untagged';
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    // Update count display for each tag
    tags.forEach(tag => {
        const count = tagCounts[tag.name] || 0;
        const tagElements = document.querySelectorAll('.tag-item');
        tagElements.forEach(element => {
            if (element.querySelector('.font-medium').textContent === tag.name) {
                const countElement = element.querySelector('.tag-count');
                countElement.textContent = `${count} memo${count === 1 ? '' : 's'}`;
            }
        });
    });
    
    // Update count for untagged memos
    const untaggedCount = tagCounts['Untagged'] || 0;
    const untaggedElements = document.querySelectorAll('.tag-item');
    untaggedElements.forEach(element => {
        if (element.querySelector('.font-medium').textContent === 'Untagged') {
            const countElement = element.querySelector('.tag-count');
            countElement.textContent = `${untaggedCount} memo${untaggedCount === 1 ? '' : 's'}`;
        }
    });
} 