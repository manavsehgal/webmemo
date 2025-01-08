# Web Memo
Multi-tasking with AI superpowers. Capture, self-organize, and chat with content as you browse the web.

[Get walkthrough on my substack](https://manavsehgal.substack.com/)

## The Backstory
I built a fully functional Chrome Extension called… wait for it… Web Memo. Super creative right! The idea is simple… I do a lot of “snacking” on the web, watch part of a podcast here, speed read a blog there. I also multi-task a lot, research new shoes to buy for walking to work in Seattle rains, plan for upcoming birthday party for my soon-to-be 6 year old, learn new magic tricks to entertain kids at her party, sharpen my AI chops, and so on. Now the challenge is content snacking + a number of mini projects means I sometimes forget where I last read that nice blog. There is also doing too much research rabbit hole. How do I make the right decision, quickly and sanely? Then there is, I like to revisit reading this later. Then… I don’t have time to go through 1.5 hours of this podcast, what are the key takeaways which matter to me the most.

Can one humble Chrome Extension solve all this? Drumroll… I think I have cracked the code. No pun intended! Capture memos as I browse the web. Each memo can be part of a website, a product description, a blog, or an entire podcast transcript. Categorize memos automatically into project tags like Shopping, Technology, Entertainment. Then chat with my projects to get the insights I need. Store all my memos locally. So no hosting and super fast responses. Use the LLM of my choice. And looks like we can tick all the boxes.

## Setup and Start

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`
4. Load the extension in Chrome by navigating to chrome://extensions/ and clicking "Load unpacked."
5. Click "Capture" to start capturing memos.
6. Click "Chat" to start chatting with your memos.
7. Click "Tags" to browse filtered memos.

## Features

### Content Capture
- Intelligent text selection and capture from any webpage
- Support for capturing partial content or entire pages
- Automatic content processing and organization
- Word count tracking for captured content

### Smart Organization
- Automatic tag generation for content categorization
- Project-based organization of captured content
- Flexible filtering and browsing by tags
- Detailed memo view with metadata and source tracking

### AI-Powered Analysis
- Chat interface for interacting with your captured content
- Project-specific conversations with AI
- Choice between using source content or processed narratives
- Token count optimization for AI interactions
- Ability to save and revisit chat conversations

### Privacy & Performance
- Local storage of all memos for privacy and speed
- Support for multiple AI providers (Anthropic, OpenAI)
- Secure API key management

### User Interface
- Clean, modern side panel interface
- Quick access through browser extension icon
- Intuitive navigation between memos, tags, and chat
- Visual feedback for content capture and processing
- Dark mode support

## Coming Soon
- AWS integration capabilities for access to Amazon Bedrock managed models
- Ollama integration for access models on local machine
- OpenAI integration
- Gemini integration