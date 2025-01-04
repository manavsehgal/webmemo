// Check if script is already initialized
if (!window.webMemoInitialized) {
    window.webMemoInitialized = true;
    
    // Initialize global state
    window.webMemo = {
        isHighlightMode: false,
        highlightedElement: null
    };

    // Initialize the content script
    function initialize() {
        console.log('Web Memo content script initialized');
    }

    // Listen for messages from the side panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request);
        if (request.action === 'toggleHighlightMode') {
            window.webMemo.isHighlightMode = request.enabled;
            document.body.style.cursor = window.webMemo.isHighlightMode ? 'crosshair' : 'default';
            sendResponse({ success: true });
        }
        return true; // Keep the message channel open for async response
    });

    // Add mouseover effect for elements
    document.addEventListener('mouseover', (e) => {
        if (!window.webMemo.isHighlightMode) return;
        
        if (window.webMemo.highlightedElement) {
            window.webMemo.highlightedElement.style.outline = '';
        }
        
        window.webMemo.highlightedElement = e.target;
        e.target.style.outline = '2px solid #3B82F6';
        e.stopPropagation();
    });

    // Handle click on highlighted element
    document.addEventListener('click', async (e) => {
        if (!window.webMemo.isHighlightMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        console.log('Selected element:', element);
        
        // Clone the element to strip inline styles and scripts
        const cleanElement = element.cloneNode(true);
        
        // Function to clean content
        function cleanContent(node) {
            // Remove unwanted elements
            const unwantedTags = ['script', 'style', 'link', 'meta', 'noscript', 'iframe', 'object', 'embed'];
            unwantedTags.forEach(tag => {
                const elements = node.getElementsByTagName(tag);
                [...elements].forEach(el => el.remove());
            });
            
            // Remove all comments
            const iterator = document.createNodeIterator(node, NodeFilter.SHOW_COMMENT);
            let currentNode;
            while (currentNode = iterator.nextNode()) {
                currentNode.parentNode.removeChild(currentNode);
            }
            
            // Clean all elements
            const allElements = node.getElementsByTagName('*');
            [...allElements].forEach(el => {
                // Remove all attributes except a few essential ones
                const allowedAttributes = ['href', 'src', 'alt', 'title'];
                [...el.attributes].forEach(attr => {
                    if (!allowedAttributes.includes(attr.name)) {
                        el.removeAttribute(attr.name);
                    }
                });
                
                // Remove empty elements that don't add value
                const emptyTags = ['div', 'span', 'p', 'section', 'article'];
                if (emptyTags.includes(el.tagName.toLowerCase()) && 
                    !el.textContent.trim() && 
                    !el.querySelector('img')) {
                    el.remove();
                }
                
                // Remove data attributes
                Object.keys(el.dataset).forEach(key => {
                    delete el.dataset[key];
                });
            });
            
            // Clean whitespace and normalize text
            node.innerHTML = node.innerHTML
                .replace(/(\s{2,}|\n|\t|\r)/g, ' ')  // Replace multiple spaces, newlines, tabs with single space
                .replace(/>\s+</g, '><')             // Remove whitespace between tags
                .trim();                             // Trim outer whitespace
            
            return node;
        }
        
        // Clean the content
        const cleanedElement = cleanContent(cleanElement);
        
        const memoData = {
            url: window.location.href,
            favicon: document.querySelector('link[rel="icon"]')?.href || `${window.location.origin}/favicon.ico`,
            timestamp: new Date().toISOString(),
            rawHtml: cleanedElement.innerHTML
        };
        
        console.log('Sending memo data:', memoData);
        
        try {
            // Notify that saving is starting
            chrome.runtime.sendMessage({
                action: 'savingMemo'
            });
            
            // Send the data to the background script
            await chrome.runtime.sendMessage({
                action: 'processMemo',
                data: memoData
            });
            
            // Reset highlight mode
            window.webMemo.isHighlightMode = false;
            document.body.style.cursor = 'default';
            if (window.webMemo.highlightedElement) {
                window.webMemo.highlightedElement.style.outline = '';
                window.webMemo.highlightedElement = null;
            }
            
            // Show success message
            const toast = document.createElement('div');
            toast.textContent = 'Content saved successfully!';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #10B981;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                z-index: 10000;
                font-family: system-ui, -apple-system, sans-serif;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
            
        } catch (error) {
            console.error('Failed to send memo data:', error);
            alert('Failed to save memo. Please try again.');
        }
    });

    // Initialize the content script
    initialize();
} else {
    console.log('Web Memo content script already initialized');
} 