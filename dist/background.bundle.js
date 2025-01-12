// lib/anthropic-client.js
var AnthropicClient = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.anthropic.com/v1";
  }
  async messages(options) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: options.model || "claude-3-5-sonnet-20241022",
        max_tokens: options.max_tokens || 4096,
        system: options.system,
        messages: options.messages
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "API request failed");
    }
    const data = await response.json();
    return {
      content: [{ text: data.content[0].text }]
    };
  }
};
var Anthropic = class {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.messages = {
      create: (options) => new AnthropicClient(this.apiKey).messages(options)
    };
  }
};

// anthropic.js
var anthropicApiKey = "";
var anthropicClient = null;
function initializeAnthropicClient(apiKey) {
  anthropicApiKey = apiKey;
  anthropicClient = new Anthropic({
    apiKey: anthropicApiKey
  });
  return anthropicClient;
}
async function processChatMessage(messages) {
  if (!anthropicClient) {
    throw new Error("Anthropic API key not set. Please set your API key first.");
  }
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const chatMessages = messages.filter((m) => m.role !== "system");
  try {
    const response = await anthropicClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemMessage,
      messages: chatMessages
    });
    return { success: true, reply: response.content[0].text };
  } catch (error) {
    console.error("Chat API error:", error);
    throw error;
  }
}
async function processWithClaude(rawHtml, url, tags) {
  if (!anthropicClient) {
    throw new Error("Anthropic API key not set");
  }
  try {
    const systemMessage = `You are an AI assistant that processes web content into structured memos. 
        Given HTML content and a URL, you will:
        1. Extract and summarize the key information
        2. Create a narrative version
        3. Generate structured data
        4. Select the most appropriate tag from the available tags
        
        Available tags: ${tags.map((t) => t.name).join(", ")}`;
    const response = await anthropicClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemMessage,
      messages: [{
        role: "user",
        content: `Process this web content into a memo:
                URL: ${url}
                Content: ${rawHtml}
                
                Return the results in this JSON format:
                {
                    "title": "Extracted title",
                    "summary": "Brief summary",
                    "narrative": "Narrative version",
                    "structuredData": {}, // Relevant structured data
                    "selectedTag": "Most appropriate tag"
                }`
      }]
    });
    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.error("Error processing with Claude:", error);
    throw error;
  }
}

// background.js
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
async function handleMemo(memoData) {
  try {
    const tagsResult = await chrome.storage.local.get(["tags"]);
    const tags = tagsResult.tags || [];
    console.log("Processing memo with tags:", tags);
    console.log("Processing memo with content length:", memoData.rawHtml.length);
    const processedContent = await processWithClaude(memoData.rawHtml, memoData.url, tags);
    console.log("Received processed content:", processedContent);
    const memo = {
      id: Date.now().toString(),
      url: memoData.url,
      favicon: memoData.favicon,
      timestamp: memoData.timestamp,
      sourceHtml: memoData.rawHtml,
      // Save the cleaned HTML
      title: processedContent.title,
      summary: processedContent.summary,
      narrative: processedContent.narrative,
      structuredData: processedContent.structuredData,
      tag: processedContent.selectedTag
    };
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(["memos"], (result) => {
        const memos = result.memos || [];
        memos.unshift(memo);
        chrome.storage.local.set({ memos }, () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
              try {
                chrome.tabs.sendMessage(tabs[0].id, { action: "memoSaved" });
              } catch (error) {
                console.error("Failed to notify content script:", error);
              }
            }
            chrome.runtime.sendMessage({ action: "memoSaved" });
            resolve();
          });
        });
      });
    });
  } catch (error) {
    console.error("Error processing memo:", error);
    console.error("Error details:", error.message);
    chrome.runtime.sendMessage({
      action: "error",
      error: error.message
    });
  }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processMemo") {
    handleMemo(request.data).then(() => sendResponse({ success: true })).catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === "setApiKey") {
    initializeAnthropicClient(request.apiKey);
    chrome.storage.local.set({ anthropicApiKey: request.apiKey });
    sendResponse({ success: true });
  } else if (request.action === "chatMessage") {
    processChatMessage(request.messages).then((response) => sendResponse(response)).catch((error) => {
      console.error("Chat API error:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }
});
chrome.storage.local.get(["anthropicApiKey"], (result) => {
  if (result.anthropicApiKey) {
    initializeAnthropicClient(result.anthropicApiKey);
  }
});
