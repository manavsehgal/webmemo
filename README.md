# Web Memo
Multi-tasking with AI superpowers. Capture, self-organize, and chat with content as you browse the web.

## User Journey
Web Memo is a Chrome extension that allows you to capture, self-organize, and chat with content as you browse the web. You can use Web Memo to organize your shopping, entertainment, learning, research, and more.

### Investing Workflow

You can capture entire transcripts of podcasts and YouTube videos. Web Memo will automatically summarize the content and generate a narrative version of it. You can create a project for your investment thesis and capture content related to it. You can chat with your memos by investment thesis project tag. The chat will be context aware and use the project description or objective along with locally stored memo narratives and structured data to provide fast, accurate, and relevant responses. You can save important chat conversations and expand on them later. There is also an option to chat with the original content source of the memos. The chat responses include clickable links to cited memos. Once inside memo details view, you can click to open the original content source in a new browser tab.

![Web Memo Workflow](images/web-memo-workflow.png)

### Shopping Workflow
Let us say you are planning a birthday party for your 6 year old. As you search for toys and decorations to buy, you can capture the content you find on Amazon, Target, and other stores. You can also capture content from blogs, podcasts, and other websites. As you capture content, Web Memo will automatically categorize it into projects like Shopping, Toys, Party Planning, etc. Web Memo will also automatically summarize the content and generate a narrative version of it. If the content is product details with price, reviews, and other data about the product, Web Memo will extract that data and store it in a structured format.

Your memos are stored locally in your browser, so they retrieved quickly and secure. You can also browse your captured memos filtered by project tags. So, you can resume your research anytime and start where you left off.

You can also chat with your memos by project tag. The chat will be context aware and use the project description or objective along with locally stored memo narratives and structured data to provide fast, accurate, and relevant responses. You can save important chat conversations and expand on them later. There is also an option to chat with the original content source of the memos. The chat responses include clickable links to cited memos. Once inside memo details view, you can click to open the original content source in a new browser tab.

This completes the loop. You can capture content, self-organize it, chat with it to analyze it, and then click through to the original content source to take action.

## Requirements Specification
*Note: These requirements specifications were reverse engineered from the codebase using AI. They were then reviewed and edited by the author.*

### Core Requirements
1. Chrome Extension with side panel interface
2. Content capture from any webpage
3. Local storage of memos and metadata
4. Automatic content categorization
5. AI-powered chat interface
6. Tag-based organization
7. Offline-first architecture
8. Custom LLM integration support
9. Anthropic Claude API integration
10. Secure API key management
11. Project-based content organization
12. Structured data extraction
13. Source linking and navigation
14. Chrome Side Panel integration
15. Cross-origin resource access

### Technical Requirements
1. Manifest V3 compliance
2. Cross-origin content access
3. Secure local storage
4. Real-time content highlighting
5. Asynchronous background processing
6. Token-aware content processing
7. Responsive UI design
8. JSON sanitization and validation
9. Error handling and recovery
10. Message-based architecture
11. Content processing limits (4096 tokens)
12. Favicon and metadata extraction
13. DOM manipulation and event handling
14. Content sanitization and cleaning
15. Visual feedback system
16. Cross-script communication
17. ESM module support
18. Browser-compatible bundling
19. Minimal dependency footprint
20. Content Security Policy (CSP) compliance
21. Service Worker architecture

### Development Requirements
1. Node.js environment
2. ESBuild bundling system
3. Module-based architecture
4. Browser platform targeting
5. Development build process
6. Production optimization

### Dependencies
- Production:
  - @anthropic-ai/sdk: AI integration for content processing (v0.18.0)
- Development:
  - esbuild: Modern JavaScript bundling (v0.20.1)

### Build System
- Uses ESBuild for fast, efficient bundling
- Currently bundles background script as service worker
- Other files loaded directly as ES modules
- Outputs ES modules for modern browser compatibility
- Optimizes dependencies for browser environment
- Supports development and production builds
- CSP-compliant output

### Required Permissions
- storage: For local data storage
- sidePanel: For Chrome side panel functionality
- scripting: For content script injection
- activeTab: For current tab access
- tabs: For tab management
- Host permissions:
  - api.anthropic.com: For AI processing
  - all_urls: For content capture

## Setup and Start

1. Clone the repository
2. Run `npm install` to install dependencies:
   - Production: @anthropic-ai/sdk (v0.18.0)
   - Development: esbuild (v0.20.1)
3. Create a `dist` directory in the project root
4. Run `npm run build` to bundle the extension
   - This creates optimized browser-compatible bundle for the background service worker
   - Note: Only background.js is currently bundled, other files are loaded directly
5. Load the extension in Chrome:
   - Navigate to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory
6. Configure the extension:
   - Set up your Anthropic API key
   - Configure any custom preferences
7. Start using the extension:
   - Click "Capture" to start capturing memos
   - Click "Chat" to start chatting with your memos
   - Click "Tags" to browse filtered memos

Note: The extension uses strict Content Security Policy (CSP) settings. When developing, make sure any added scripts or resources comply with the CSP rules defined in manifest.json.

## Development

### Build System
- Uses ESBuild for fast, efficient bundling
- Outputs ES modules for modern browser compatibility
- Optimizes dependencies for browser environment
- Supports development and production builds

### Dependencies
- Production:
  - @anthropic-ai/sdk: AI integration for content processing
- Development:
  - esbuild: Modern JavaScript bundling

### Architecture
- ES Module-based design
- Browser-compatible output
- Minimal external dependencies
- Optimized bundle size

## Documentation

### LLM Provider Architecture
The LLM (Large Language Model) provider integration is a core component of Web Memo, handling content processing and chat functionality. Here's how it works:

#### Core Components
1. **LLM Provider Factory**
   - Central factory class for creating LLM provider instances
   - Supports multiple provider types (currently Anthropic Claude)
   - Handles provider configuration and validation
   - Extensible design for future LLM integrations

2. **Background Processing**
   - Manages core LLM operations in background.js
   - Handles memo processing and chat message routing
   - Manages API key initialization and storage
   - Provides error handling and recovery

3. **UI Integration**
   - Chat interface in sidepanel.js
   - Message display and formatting
   - Chat history management
   - Memo citation and navigation
   - Memo display and management through ui.js

#### Data Flow
1. **Memo Processing**
   - Content capture → handleMemo()
   - Content processing through Claude
   - Storage and display of processed content

2. **Chat Interactions**
   - User message routing
   - LLM provider processing
   - Response formatting with memo citations
   - Chat history management

#### Key Features
- Tag-based memo organization
- Context-aware chat with memo references
- Structured data extraction
- Source vs. processed content toggle
- Saved chat conversation management
- Memo citation and navigation system

### Content Capture System
The Content Capture System enables users to select and save content from any webpage, with intelligent processing and organization. Here's how it works:

#### Core Components
1. **Content Selection**
   - Interactive highlight mode with visual feedback
   - Real-time element highlighting and preview
   - Cross-origin content capture support
   - Visual selection guide and cursor feedback

2. **Content Processing**
   - HTML content sanitization and cleaning
   - Removal of scripts, styles, and unwanted markup
   - Preservation of essential attributes and structure
   - Automatic metadata extraction (URL, favicon, timestamp)

3. **Background Processing**
   - Asynchronous content processing through Claude
   - Automatic tag suggestion
   - Title and summary extraction
   - Narrative content generation
   - Structured data identification

#### Data Flow
1. **Selection Process**
   - User activates capture mode
   - Real-time element highlighting
   - Click to select content
   - Initial content cleaning and sanitization

2. **Processing Pipeline**
   - Content sanitization and normalization
   - Metadata extraction
   - LLM processing for insights
   - Storage and indexing
   - UI updates and notifications

#### Key Features
- Visual element highlighting
- Intelligent content cleaning
- Cross-origin support
- Automatic tag suggestion
- Structured data extraction
- Progress indicators
- Error handling and recovery
- Source preservation

### Storage and Data Management
The Storage and Data Management system provides robust local data persistence and synchronization capabilities. Here's how it works:

#### Core Components
1. **Local Storage**
   - Chrome's storage.local API for primary data storage
   - Stores complete memo content, tags, and chat history
   - Handles large content volumes efficiently
   - Maintains data structure integrity

2. **Sync Storage**
   - Chrome's storage.sync API for backup and sync
   - Stores lightweight metadata for cross-device sync
   - Handles API keys and user preferences
   - Provides data recovery capabilities

3. **Data Models**
   - Memo: content, metadata, tags, and structured data
   - Tags: name, description, color, and icon
   - Chats: messages, context, and tag associations
   - User preferences and API configurations

#### Data Flow
1. **Storage Operations**
   - Automatic saving of captured content
   - Background synchronization of metadata
   - Incremental updates for large datasets
   - Error handling and recovery mechanisms

2. **Data Management**
   - CRUD operations for memos and tags
   - Automatic backup creation
   - Data integrity validation
   - Storage quota management

#### Key Features
- Offline-first architecture
- Automatic data backup
- Cross-device synchronization
- Data recovery mechanisms
- Storage optimization
- Quota management
- Data integrity checks
- Secure API key storage

### Tag Management System
The Tag Management System provides a flexible and intuitive way to organize and categorize content. Here's how it works:

#### Core Components
1. **Tag Structure**
   - Name and description fields
   - Visual customization (colors and icons)
   - Memo count tracking
   - Hierarchical organization support
   - Predefined and custom tags

2. **Tag Operations**
   - Create, read, update, delete (CRUD) operations
   - Validation and duplicate prevention
   - Automatic tag suggestions
   - Batch tag management
   - Tag count maintenance

3. **UI Integration**
   - Visual tag editor and creator
   - Icon selection with categorized options
   - Color scheme customization
   - Tag filtering and search
   - Tag-based memo filtering

#### Data Flow
1. **Tag Creation**
   - User input validation
   - Duplicate checking
   - Visual customization
   - Storage synchronization
   - UI updates

2. **Tag Usage**
   - Memo tagging and untagging
   - Tag-based filtering
   - Count updates
   - Chat context integration
   - Search and organization

#### Key Features
- Rich visual customization
- Intuitive tag management
- Automatic tag suggestions
- Tag-based organization
- Tag-specific chat contexts
- Tag statistics and analytics
- Hierarchical organization
- Cross-memo tag consistency

### UI Components and Workflow
The UI system provides an intuitive and responsive interface for managing memos and interacting with content. Here's how it works:

#### Core Components
1. **Navigation Bar**
   - Memo list/detail toggle
   - Tag management access
   - Chat interface toggle
   - Settings panel access
   - Content capture button

2. **Content Views**
   - Memo List: Displays all memos with filtering
   - Memo Detail: Shows comprehensive memo information
   - Tag Management: Interface for organizing tags
   - Chat Interface: Context-aware chat system
   - Settings Panel: Configuration options

3. **Interactive Elements**
   - Content capture highlighting
   - Tag selection and filtering
   - Chat message composition
   - Source/processed content toggle
   - Status notifications

#### Workflow Processes
1. **Content Capture**
   - Activation via toolbar button
   - Visual highlight mode with feedback
   - Content selection and processing
   - Tag assignment and organization

2. **Content Management**
   - Memo browsing and filtering
   - Detail view navigation
   - Export and sharing options
   - Deletion with confirmation

3. **Chat Interaction**
   - Tag-based context selection
   - Message composition
   - Citation and reference system
   - Chat history management

#### Key Features
- Modern, responsive design
- Intuitive navigation system
- Real-time status updates
- Smooth transitions
- Keyboard shortcuts
- Cross-browser compatibility
- Accessibility support
- Error handling with feedback

### Security and Privacy Features
The Security and Privacy system ensures user data protection and secure API interactions. Here's how it works:

#### Core Components
1. **Data Storage Security**
   - Local-first data storage architecture
   - Encrypted Chrome storage APIs
   - Secure backup synchronization
   - Minimal metadata sync strategy
   - Data integrity validation

2. **API Security**
   - Secure API key management
   - Encrypted key storage
   - Key visibility controls
   - API access validation
   - Request/response encryption

3. **Content Security**
   - Content Security Policy (CSP) enforcement
   - Cross-origin resource protection
   - Script injection prevention
   - Secure content sanitization
   - Safe HTML processing

#### Security Measures
1. **API Key Protection**
   - Secure key storage in Chrome's encrypted storage
   - Key visibility toggle in UI
   - Automatic key validation
   - Secure key transmission
   - Key recovery mechanisms

2. **Data Protection**
   - Local storage encryption
   - Secure backup strategy
   - Data integrity checks
   - Safe deletion procedures
   - Recovery mechanisms

3. **Extension Security**
   - Strict CSP implementation
   - Limited host permissions
   - Secure message passing
   - Safe content handling
   - Error state management

#### Key Features
- Encrypted storage system
- Secure API communication
- CSP-based security
- Safe content processing
- Data backup protection
- Privacy-first architecture
- Secure key management
- Safe data recovery

### Chat System Architecture
The Chat System provides an intelligent interface for interacting with memo content through natural language. Here's how it works:

#### Core Components
1. **Chat Interface**
   - Tag-based context selection
   - Message composition area
   - Real-time typing indicators
   - Source content toggle
   - Token count display
   - Chat history viewer
   - Save/restore functionality

2. **Message Processing**
   - System message generation
   - Context assembly from memos
   - LLM provider integration
   - Response formatting
   - Citation linking
   - Error handling

3. **Chat Management**
   - Conversation persistence
   - Tag-based organization
   - History browsing
   - Chat restoration
   - Context switching
   - Session management

#### Data Flow
1. **Message Handling**
   - User input validation
   - Context preparation
   - Background processing
   - Response rendering
   - Citation generation
   - UI state management

2. **Context Management**
   - Tag-based memo filtering
   - System prompt generation
   - Source/processed toggle
   - Token counting
   - Context windowing
   - Memory management

3. **Chat Storage**
   - Conversation saving
   - History organization
   - Tag-based filtering
   - Backup creation
   - Safe deletion
   - Recovery options

#### Key Features
- Context-aware responses
- Tag-based conversations
- Source/processed toggle
- Real-time feedback
- Citation system
- History management
- Token optimization
- Error recovery
- Saved chat browsing
- Multi-context support

### Error Handling and Recovery
The Error Handling and Recovery system ensures robust operation and graceful failure handling. Here's how it works:

#### Core Components
1. **Status Management**
   - Visual status indicators
   - Error message display
   - Processing state feedback
   - Success confirmations
   - Operation progress tracking
   - Automatic status clearing

2. **Error Detection**
   - API failure monitoring
   - Storage operation checks
   - Network error detection
   - Data validation
   - State consistency checks
   - Resource availability monitoring

3. **Recovery Mechanisms**
   - Automatic data backup
   - State restoration
   - Graceful degradation
   - Operation retry logic
   - Fallback strategies
   - User notification system

#### Error Handling Flow
1. **Operation Monitoring**
   - Status tracking
   - Error detection
   - State validation
   - Resource monitoring
   - Performance tracking
   - User feedback

2. **Recovery Process**
   - Error categorization
   - Recovery strategy selection
   - State restoration
   - Data reconciliation
   - User notification
   - Operation resumption

3. **Prevention Measures**
   - Data validation
   - State consistency checks
   - Resource pre-checks
   - Quota management
   - Backup creation
   - Safe operation patterns

#### Key Features
- Real-time status updates
- Graceful error recovery
- Automatic data backup
- User-friendly notifications
- Operation retry logic
- State preservation
- Safe deletion procedures
- Recovery mechanisms

### Extension Architecture
The Extension Architecture follows Chrome's Manifest V3 specifications, providing a robust and secure foundation. Here's how it works:

#### Core Components
1. **Service Worker**
   - Background script (`background.js`) running as a service worker
   - Handles core extension operations and state management
   - Manages API initialization and message routing
   - Processes memos and chat interactions asynchronously
   - Maintains extension lifecycle and data persistence

2. **Content Scripts**
   - Injected into web pages for content interaction
   - Manages highlight mode and element selection
   - Handles cross-origin content capture
   - Communicates with service worker via messages
   - Provides real-time visual feedback

3. **Side Panel Interface**
   - Primary user interface (`sidepanel.html`, `sidepanel.js`)
   - Manages memo list and detail views
   - Handles chat interface and interactions
   - Controls tag management and settings
   - Provides status notifications and feedback

#### Communication Flow
1. **Message Passing**
   - Content script ↔ Service Worker communication
   - Side Panel ↔ Service Worker interaction
   - Cross-origin message handling
   - Error state propagation
   - Status updates and notifications

2. **State Management**
   - Local storage for persistent data
   - Sync storage for cross-device metadata
   - API key management
   - Runtime state handling
   - Error recovery mechanisms

#### Key Features
- Manifest V3 compliance
- ES Module-based architecture
- Minimal external dependencies
- Optimized bundle size
- CSP-compliant security
- Cross-origin support
- Asynchronous processing
- Real-time UI updates
- Robust error handling
- Development and production builds

### Build and Development System
The Build and Development System provides a streamlined workflow for developing and deploying the extension. Here's how it works:

#### Core Components
1. **Build System**
   - ESBuild-based bundling system
   - Service worker bundling with browser targeting
   - ES Module output format
   - Dependency optimization
   - CSP-compliant bundling
   - Development and production modes

2. **Development Environment**
   - Node.js runtime environment
   - NPM package management
   - Module-based architecture
   - Chrome Extension APIs
   - Local development server
   - Hot reload support

3. **Project Structure**
   - Source code organization
   - Asset management
   - Configuration files
   - Build output management
   - Environment configuration
   - Version control integration

#### Build Process
1. **Development Build**
   - Fast bundling with ESBuild
   - Source map generation
   - Development-specific optimizations
   - Automatic dependency resolution
   - Module format preservation
   - Browser-compatible output

2. **Production Build**
   - Code optimization and minification
   - Dead code elimination
   - Dependency tree shaking
   - Asset optimization
   - CSP header generation
   - Distribution package creation

#### Key Features
- Fast, efficient bundling
- ES Module support
- Browser compatibility
- Minimal dependencies
- Development optimization
- Production readiness
- CSP compliance
- Source map support
- Hot reload capability
- Error reporting

## Future Roadmap

*Note: These are just ideas and not necessarily in order of priority and not all will be implemented as right now I am only working on this over weekends. If you are interested in collaborating on this project, please reach out.*

1. Multi-LLM Integration: Enable users to choose between OpenAI, Google, or run local models via Ollama for content processing and chat interactions.

2. Extended Content Sources: Capture and process content from YouTube videos, Twitter threads, and other social media platforms directly within the extension.

3. Rich Media Support: Process and analyze images, videos, and audio content, enabling comprehensive multi-media content capture and organization.

4. Advanced Format Handling: Import and process content from markdown files, PDFs, and other document formats while preserving structure and formatting.

5. Enhanced Content Analysis: Implement sentiment analysis, topic modeling, and advanced content categorization to provide deeper insights into captured content.

6. Data Visualization: Generate interactive charts, graphs, and visual representations of content relationships and insights.

7. Content Distribution: Share memos and insights via email, SMS, and other communication channels directly from the extension.

8. Collaborative Features: Enable memo sharing and collaborative content organization among team members or research groups.

9. Task Management Integration: Convert memos into actionable items like to-do lists, checklists, and project milestones.

10. Calendar Integration: Create calendar events, schedule meetings, and set reminders based on memo content and insights.

11. Automated Workflows: Implement AI agents that can execute tasks based on memo content, such as creating shopping lists or scheduling appointments.

12. System Integration: Enable the extension to interact with system applications, creating spreadsheets, performing web searches, and managing files based on memo content and user objectives.

## Epics

### 1. Content Capture
- Webpage content selection and capture
- Rich text formatting preservation
- Source URL and metadata tracking
- Automatic tag suggestion
- Content highlighting mode
- HTML content sanitization
- Favicon capture and storage
- Interactive element selection
- Visual selection feedback
- Content cleaning and normalization
- Script and style removal
- Empty element handling
- Whitespace normalization
- Product data extraction
- Price information capture
- Review content preservation
- Multi-source content aggregation

### 2. Content Organization
- Automatic content categorization
- Tag-based filtering
- Search functionality
- Content statistics and analytics
- Memo management (edit, delete, archive)
- Structured data extraction
- Domain-based content organization
- Project (tag) based grouping
- Research continuity support
- Multi-project organization

### 3. AI Integration
- LLM API integration
- Context-aware chat interface
- Tag-specific conversations
- Chat history management
- System prompt optimization
- Narrative content generation
- Auto-summarization
- Content structure analysis
- Fallback handling for API failures
- Project objective awareness
- Multi-memo context synthesis
- Source citation in responses
- Structured data integration in chat

### 4. User Experience
- Side panel navigation
- Content preview and detail views
- Tag management interface
- Settings configuration
- Status notifications
- Error state handling
- Processing status indicators
- API configuration management
- Visual selection mode
- Cursor state feedback
- Selection highlighting
- Progress indicators
- Error notifications
- Cross-browser compatibility
- Source navigation
- Research resumption
- Project context switching
- Multi-task support

## User Stories

### Content Capture
- As a user, I want to highlight and save specific parts of webpages
- As a user, I want to capture entire articles with proper formatting
- As a user, I want automatic suggestions for categorizing my captures
- As a user, I want to see the source URL and capture date for my memos
- As a user, I want website favicons to be saved with my memos for visual recognition
- As a user, I want my captured content to be automatically summarized
- As a user, I want a narrative version of my captured content
- As a user, I want visual feedback when selecting content to capture
- As a user, I want to see what element I'm about to capture before clicking
- As a user, I want captured content to be clean and free of unnecessary markup
- As a user, I want to easily identify selectable content while in capture mode
- As a user, I want to be notified when my content is being processed
- As a user, I want to be informed if content capture fails
- As a user, I want captured content to maintain its semantic structure
- As a user, I want to aggregate content from multiple sources in one project
- As a user, I want to capture content for different aspects of my project

### Content Organization
- As a user, I want to filter my memos by tags
- As a user, I want to see word counts and content statistics
- As a user, I want to edit or delete my saved memos
- As a user, I want to organize content into projects or themes
- As a user, I want structured data to be automatically extracted when available
- As a user, I want to see the domain source of my captured content
- As a user, I want my memos sorted by capture date
- As a user, I want to organize content into distinct projects like shopping, learning, and research
- As a user, I want to resume my research from where I left off
- As a user, I want to switch between different ongoing projects easily
- As a user, I want to see all content related to a specific project in one place

### AI Chat
- As a user, I want to chat with my collected content by topic
- As a user, I want to save important chat conversations
- As a user, I want AI to summarize my collected content
- As a user, I want context-aware responses based on my memos
- As a user, I want to customize system prompts for different chat contexts
- As a user, I want graceful handling of API failures during chat
- As a user, I want to see when the AI is processing my request
- As a user, I want chat responses that understand my project objectives
- As a user, I want to see source links in chat responses
- As a user, I want to chat about specific aspects of my project
- As a user, I want chat responses that combine information from multiple memos
- As a user, I want to navigate from chat responses to original sources

### Settings & Configuration
- As a user, I want to configure my preferred LLM API
- As a user, I want to manage my saved chat histories
- As a user, I want to customize tag colors and organization
- As a user, I want to back up and restore my data
- As a user, I want to securely store my API keys
- As a user, I want to be notified when my API key is missing or invalid
- As a user, I want to see the status of my API configuration
- As a user, I want to set project-specific preferences
- As a user, I want to configure default tags for different types of projects

