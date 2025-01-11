# Web Memo
Multi-tasking with AI superpowers. Capture, self-organize, and chat with content as you browse the web.

[Get walkthrough on my substack](https://manavsehgal.substack.com/)

## User Journey
Web Memo is a Chrome extension that allows you to capture, self-organize, and chat with content as you browse the web. You can use Web Memo to organize your shopping, entertainment, learning, research, and more.

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

### Development Requirements
1. Node.js environment
2. ESBuild bundling system
3. Module-based architecture
4. Browser platform targeting
5. Development build process
6. Production optimization

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

## Setup and Start

1. Clone the repository
2. Run `npm install` to install dependencies:
   - Production: @anthropic-ai/sdk (v0.18.0 or later)
   - Development: esbuild (v0.20.1 or later)
3. Run `npm run build` to bundle the extension
   - This creates optimized browser-compatible bundles in the `dist` directory
4. Load the extension in Chrome:
   - Navigate to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory
5. Configure the extension:
   - Set up your Anthropic API key
   - Configure any custom preferences
6. Start using the extension:
   - Click "Capture" to start capturing memos
   - Click "Chat" to start chatting with your memos
   - Click "Tags" to browse filtered memos

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