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
        // Add styles for highlighting
        const style = document.createElement('style');
        style.textContent = `
            .highlight-outline {
                outline: 2px solid #34D399 !important;
                outline-offset: 2px;
                transition: outline-color 0.2s ease;
            }
            .highlight-selected {
                background-color: rgba(52, 211, 153, 0.1) !important;
                outline: 2px solid #34D399 !important;
                outline-offset: 2px;
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
        console.log('Web Memo content script initialized');
    }

    // Listen for messages from the side panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request);
        if (request.action === 'toggleHighlightMode') {
            window.webMemo.isHighlightMode = request.enabled;
            document.body.style.cursor = window.webMemo.isHighlightMode ? 'crosshair' : 'default';
            
            // Clear any existing highlights when exiting highlight mode
            if (!window.webMemo.isHighlightMode && window.webMemo.selectedElement) {
                window.webMemo.selectedElement.classList.remove('highlight-selected');
                window.webMemo.selectedElement = null;
            }
            
            sendResponse({ success: true });
        } else if (request.action === 'memoSaved') {
            // Remove highlight when memo is saved
            if (window.webMemo.selectedElement) {
                window.webMemo.selectedElement.classList.remove('highlight-selected');
                window.webMemo.selectedElement = null;
            }
        }
        return true;
    });

    // Add mouseover effect for elements
    document.addEventListener('mouseover', (e) => {
        if (!window.webMemo.isHighlightMode) return;
        
        if (window.webMemo.highlightedElement) {
            window.webMemo.highlightedElement.classList.remove('highlight-outline');
        }
        
        window.webMemo.highlightedElement = e.target;
        e.target.classList.add('highlight-outline');
        e.stopPropagation();
    });

    document.addEventListener('mouseout', (e) => {
        if (!window.webMemo.isHighlightMode || !window.webMemo.highlightedElement) return;
        window.webMemo.highlightedElement.classList.remove('highlight-outline');
    });

    // Handle click on highlighted element
    document.addEventListener('click', async (e) => {
        if (!window.webMemo.isHighlightMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        console.log('Selected element:', element);
        
        // Remove hover outline and add selection effect
        element.classList.remove('highlight-outline');
        element.classList.add('highlight-selected');
        
        // Store reference to selected element
        window.webMemo.selectedElement = element;
        
        // Notify that selection is made
        chrome.runtime.sendMessage({
            action: 'selectionMade'
        });
        
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
            });
            
            // Clean whitespace and normalize text
            node.innerHTML = node.innerHTML
                .replace(/(\s{2,}|\n|\t|\r)/g, ' ')
                .replace(/>\s+</g, '><')
                .trim();
            
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
            
            // Reset highlight mode and remove selection effect
            window.webMemo.isHighlightMode = false;
            document.body.style.cursor = 'default';
            element.classList.remove('highlight-selected');
            
            if (window.webMemo.highlightedElement) {
                window.webMemo.highlightedElement.classList.remove('highlight-outline');
                window.webMemo.highlightedElement = null;
            }
            
        } catch (error) {
            console.error('Failed to send memo data:', error);
            element.classList.remove('highlight-selected');
            alert('Failed to save memo. Please try again.');
        }
    });

    // Initialize the content script
    initialize();
} else {
    console.log('Web Memo content script already initialized');
} 