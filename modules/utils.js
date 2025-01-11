// Count words in text and HTML
export function countWords(html) {
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
export function countJsonKeys(obj) {
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

// Format count with type
export function formatCount(count, type = 'words') {
    if (type === 'keys') {
        return count === 1 ? '1 key' : `${count} keys`;
    }
    const formattedCount = count.toLocaleString();  // Add thousands separators
    return count === 1 ? '1 word' : `${formattedCount} words`;
}

// Show delete confirmation dialog
export async function showDeleteConfirmation(message) {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <div class="flex justify-center mb-4">
                <img src="icons/webmemo-logo-128.png" alt="WebMemo Logo" class="w-32 h-32">
            </div>
            <h3 class="text-lg font-semibold text-gray-900 text-center">Delete Confirmation</h3>
            <p class="text-sm text-gray-600 text-center">${message}</p>
            <div class="flex justify-center space-x-3 mt-4">
                <button class="cancel-delete px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200">
                    Cancel
                </button>
                <button class="confirm-delete px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200">
                    Delete
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    return new Promise((resolve) => {
        dialog.querySelector('.cancel-delete').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(false);
        });
        
        dialog.querySelector('.confirm-delete').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(true);
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                resolve(false);
            }
        });
    });
} 