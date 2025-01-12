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
    
    // Initialize selectedIcon and selectedColor at the top
    let selectedIcon = predefinedTags[0].icon;
    let selectedColor = 'gray';
    
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
    newTagForm.id = 'addTagForm';
    newTagForm.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    newTagForm.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Add New Tag</h3>
                <button id="cancelAddTag" class="text-gray-400 hover:text-gray-500">
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="space-y-6">
                <div>
                    <label for="tagName" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" id="tagName" 
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter tag name">
                </div>
                <div>
                    <label for="tagDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="tagDescription" rows="3" 
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Enter tag description"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div class="grid grid-cols-8 gap-2">
                        <button class="color-option w-8 h-8 rounded-full bg-gray-500 hover:ring-2 hover:ring-offset-2 hover:ring-gray-500" data-color="gray"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-red-500 hover:ring-2 hover:ring-offset-2 hover:ring-red-500" data-color="red"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-yellow-500 hover:ring-2 hover:ring-offset-2 hover:ring-yellow-500" data-color="yellow"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-green-500 hover:ring-2 hover:ring-offset-2 hover:ring-green-500" data-color="green"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-blue-500 hover:ring-2 hover:ring-offset-2 hover:ring-blue-500" data-color="blue"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-indigo-500 hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500" data-color="indigo"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-purple-500 hover:ring-2 hover:ring-offset-2 hover:ring-purple-500" data-color="purple"></button>
                        <button class="color-option w-8 h-8 rounded-full bg-pink-500 hover:ring-2 hover:ring-offset-2 hover:ring-pink-500" data-color="pink"></button>
                    </div>
                </div>
                <div>
                    <label for="tagIcon" class="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <div class="relative">
                        <button type="button" id="iconDropdownButton"
                            class="w-full bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <div class="flex items-center">
                                <div id="selectedIconPreview" class="w-5 h-5 mr-2">
                                    <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                                        ${selectedIcon}
                                    </svg>
                                </div>
                                <span id="selectedIconName" class="text-gray-900">Select an icon</span>
                                <svg class="w-5 h-5 ml-auto text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </button>
                        
                        <div id="iconDropdown" class="hidden absolute z-10 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md overflow-hidden">
                            <div class="sticky top-0 bg-white border-b border-gray-200">
                                <div class="p-2">
                                    <input type="text" id="tagIconSearch" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Search icons...">
                                </div>
                            </div>
                            <div id="iconList" class="overflow-auto max-h-80">
                                <!-- Icons will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4 border-t">
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
        populateIconGrid();
    });
    
    // Add icon dropdown event listeners
    const iconDropdownButton = document.getElementById('iconDropdownButton');
    const iconDropdown = document.getElementById('iconDropdown');
    const tagIconSearch = document.getElementById('tagIconSearch');
    
    iconDropdownButton.addEventListener('click', () => {
        iconDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!iconDropdown.contains(e.target) && !iconDropdownButton.contains(e.target)) {
            iconDropdown.classList.add('hidden');
        }
    });

    // Handle icon search
    tagIconSearch.addEventListener('input', (e) => {
        populateIconGrid(e.target.value);
    });
    
    // Handle color selection
    newTagForm.querySelectorAll('.color-option').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            selectedColor = button.dataset.color;
            // Remove ring from all buttons and add to selected
            newTagForm.querySelectorAll('.color-option').forEach(b => b.classList.remove('ring-2', 'ring-offset-2'));
            button.classList.add('ring-2', 'ring-offset-2');
        });
    });

    // Handle icon search and selection
    const iconSearch = document.getElementById('tagIconSearch');
    iconSearch.addEventListener('input', () => {
        populateIconGrid(iconSearch.value);
    });

    function populateIconGrid(searchTerm = '') {
        const iconList = document.getElementById('iconList');
        iconList.innerHTML = '';
        
        // Comprehensive icon set organized by categories
        const iconCategories = {
            'Common': [
                { name: 'Tag', path: predefinedTags[0].icon },
                { name: 'Bookmark', path: '<path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clip-rule="evenodd"/>' },
                { name: 'Star', path: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>' },
                { name: 'Heart', path: '<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>' },
                { name: 'Flag', path: '<path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6zM15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"/>' }
            ],
            'Content': [
                { name: 'Document', path: '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>' },
                { name: 'Document Text', path: '<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>' },
                { name: 'Book Open', path: '<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>' },
                { name: 'Newspaper', path: '<path fill-rule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clip-rule="evenodd"/><path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"/>' },
                { name: 'Clipboard', path: '<path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>' },
                { name: 'Annotation', path: '<path fill-rule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clip-rule="evenodd"/>' }
            ],
            'Development': [
                { name: 'Code', path: '<path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>' },
                { name: 'Terminal', path: '<path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>' },
                { name: 'Database', path: '<path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/><path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/><path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>' },
                { name: 'Chip', path: '<path d="M13 7H7v6h6V7z"/><path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clip-rule="evenodd"/>' },
                { name: 'Cloud', path: '<path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/>' }
            ],
            'Organization': [
                { name: 'Folder', path: '<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>' },
                { name: 'Collection', path: '<path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>' },
                { name: 'Archive', path: '<path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/><path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"/>' },
                { name: 'Briefcase', path: '<path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>' }
            ],
            'Research': [
                { name: 'Search', path: '<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>' },
                { name: 'Academic Cap', path: '<path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>' },
                { name: 'Light Bulb', path: '<path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>' },
                { name: 'Beaker', path: '<path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clip-rule="evenodd"/>' }
            ],
            'Communication': [
                { name: 'Chat', path: '<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>' },
                { name: 'Mail', path: '<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>' },
                { name: 'Phone', path: '<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>' },
                { name: 'Share', path: '<path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>' }
            ],
            'Status': [
                { name: 'Check Circle', path: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' },
                { name: 'Exclamation', path: '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>' },
                { name: 'Clock', path: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>' }
            ]
        };

        // Create category headers and filter icons
        let hasResults = false;
        Object.entries(iconCategories).forEach(([category, icons]) => {
            const filteredIcons = icons.filter(icon => 
                icon.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredIcons.length > 0) {
                hasResults = true;
                
                // Add category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50';
                categoryHeader.textContent = category;
                iconList.appendChild(categoryHeader);

                // Add icons
                filteredIcons.forEach(icon => {
                    const button = document.createElement('button');
                    button.className = `w-full text-left px-3 py-2 flex items-center space-x-3 hover:bg-gray-100 ${selectedIcon === icon.path ? 'bg-blue-50' : ''}`;
                    button.innerHTML = `
                        <div class="w-5 h-5 flex-shrink-0">
                            <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                                ${icon.path}
                            </svg>
                        </div>
                        <span class="text-sm text-gray-900">${icon.name}</span>
                    `;
                    button.addEventListener('click', () => {
                        selectedIcon = icon.path;
                        // Update selected state in dropdown
                        iconList.querySelectorAll('button').forEach(b => b.classList.remove('bg-blue-50'));
                        button.classList.add('bg-blue-50');
                        // Update preview
                        document.getElementById('selectedIconPreview').innerHTML = `
                            <svg class="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                                ${icon.path}
                            </svg>
                        `;
                        document.getElementById('selectedIconName').textContent = icon.name;
                        // Hide dropdown
                        document.getElementById('iconDropdown').classList.add('hidden');
                    });
                    iconList.appendChild(button);
                });
            }
        });

        // Show no results message if needed
        if (!hasResults) {
            const noResults = document.createElement('div');
            noResults.className = 'px-3 py-4 text-sm text-gray-500 text-center';
            noResults.textContent = 'No matching icons found';
            iconList.appendChild(noResults);
        }
    }
    
    document.getElementById('cancelAddTag').addEventListener('click', () => {
        newTagForm.classList.add('hidden');
        resetForm();
    });
    
    document.getElementById('saveNewTag').addEventListener('click', async () => {
        const name = document.getElementById('tagName').value.trim();
        const description = document.getElementById('tagDescription').value.trim();
        
        if (name) {
            await addNewTag(name, description, selectedColor, selectedIcon);
            newTagForm.classList.add('hidden');
            resetForm();
        }
    });

    function resetForm() {
        document.getElementById('tagName').value = '';
        document.getElementById('tagDescription').value = '';
        document.getElementById('tagIconSearch').value = '';
        selectedColor = 'gray';
        selectedIcon = predefinedTags[0].icon;
        newTagForm.querySelectorAll('.color-option').forEach(b => b.classList.remove('ring-2', 'ring-offset-2'));
        newTagForm.querySelector('[data-color="gray"]').classList.add('ring-2', 'ring-offset-2');
        populateIconGrid();
    }
    
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
export async function addNewTag(name, description, color, icon) {
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
        icon
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