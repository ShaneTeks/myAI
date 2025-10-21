# n8n Setup Guide for Chat App Integration

This guide will walk you through setting up your n8n workflow to handle chat messages from your mobile app and provide AI responses using the modern **AI Agent** node.

## Prerequisites

- n8n instance running at `https://n8n.shanetechtools.online`
- OpenAI API key
- Supabase service key (different from anon key)

## Step 1: Get Your Supabase Service Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
5. ⚠️ **Important**: Keep this key secure - it has admin access to your database

## Step 2: Create the n8n Workflow Using AI Agent Node

### Modern Approach: Using AI Agent Node (Recommended)

The AI Agent node is part of n8n's LangChain integration and provides a more powerful and flexible way to handle AI conversations with built-in memory management and tool integration.

1. **Login to your n8n instance**: https://n8n.shanetechtools.online
2. **Create a new workflow**
3. **Add the following nodes in order:**

#### Node 1: Webhook (Trigger)
- **Node Type**: Webhook
- **HTTP Method**: POST
- **Path**: `webhook-test/196c293b-915d-4b4e-b70c-35a4f1bad4ae`
- **Response Mode**: "Respond to Webhook"

#### Node 2: AI Agent
- **Node Type**: AI Agent (from @n8n/n8n-nodes-langchain)
- **Agent Type**: "Conversational Agent"
- **Chat Model**: 
  - **Model**: OpenAI Chat Model
  - **Model Name**: `gpt-4` or `gpt-3.5-turbo`
  - **API Key**: Your OpenAI API key
- **Memory**: 
  - **Memory Type**: "Buffer Memory"
  - **Session Key**: `{{ $json.conversationId }}`
- **Input**: `{{ $json.newMessage }}`
- **System Message**: `{{ $json.systemInstruction || "You are a helpful AI assistant. Continue the conversation naturally based on the context provided. Be concise but helpful." }}`

#### Node 3: Save to Supabase
- **Node Type**: HTTP Request
- **Name**: "Save to Supabase"
- **Method**: POST
- **URL**: `https://nzybisigsdwpekepbvfk.supabase.co/rest/v1/messages`
- **Headers**:
  ```
  apikey: YOUR_SUPABASE_SERVICE_KEY
  Authorization: Bearer YOUR_SUPABASE_SERVICE_KEY
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Body**:
```json
{
  "conversation_id": "{{ $json.conversationId }}",
  "content": "{{ $('AI Agent').first().json.output }}",
  "is_user": false,
  "user_id": "{{ $json.user_id }}"
}
```

#### Node 4: Respond to Webhook
- **Node Type**: Respond to Webhook
- **Response Body**:
```json
{
  "success": true,
  "response": "{{ $('AI Agent').first().json.output }}",
  "conversationId": "{{ $json.conversationId }}"
}
```

### Alternative: Manual Setup (Legacy Method)

If you prefer the traditional approach or don't have access to the AI Agent node, you can still use the manual setup:

#### Node 1: Webhook (Trigger)
- **Node Type**: Webhook
- **HTTP Method**: POST
- **Path**: `webhook-test/196c293b-915d-4b4e-b70c-35a4f1bad4ae`
- **Response Mode**: "Respond to Webhook"

#### Node 2: Format Context
- **Node Type**: Code
- **Name**: "Format Context"
- **JavaScript Code**:
```javascript
// Get the input data from the webhook
const inputData = $input.first().json;

// Extract data from the webhook body
const messages = inputData.body?.messages || inputData.messages || [];
const newMessage = inputData.body?.newMessage || inputData.newMessage;
const conversationId = inputData.body?.conversationId || inputData.conversationId;
const systemInstruction = inputData.body?.systemInstruction || inputData.systemInstruction;
const userId = inputData.body?.user_id || inputData.user_id;

// Format conversation history
const conversationHistory = messages.map(msg => {
    return `${msg.is_user ? 'User' : 'Assistant'}: ${msg.content}`;
}).join('\n\n');

// Create the full context for the AI
const fullContext = conversationHistory 
    ? `Previous conversation:\n${conversationHistory}\n\nNew message: ${newMessage}`
    : `New message: ${newMessage}`;

return {
  conversationId,
  conversationHistory,
  newMessage,
  systemInstruction,
  userId,
  fullContext
};
```

#### Node 3: OpenAI Chat Model
- **Node Type**: OpenAI Chat Model (from LangChain nodes)
- **Model**: `gpt-4` or `gpt-3.5-turbo`
- **Messages**:
  - **System Message**: `{{ $json.systemInstruction || "You are a helpful AI assistant." }}`
  - **Human Message**: `{{ $json.fullContext }}`

#### Node 4: Save to Supabase
- **Node Type**: HTTP Request
- **Method**: POST
- **URL**: `https://nzybisigsdwpekepbvfk.supabase.co/rest/v1/messages`
- **Headers**: (same as above)
- **Body**: (same as above)

#### Node 5: Respond to Webhook
- **Node Type**: Respond to Webhook
- **Response Body**: (same as above)

### Import JSON Workflow (Quick Setup)

You can import this complete workflow JSON to get started quickly:

```json
{
  "name": "Chat Agent Workflow - AI Agent",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "webhook-test/196c293b-915d-4b4e-b70c-35a4f1bad4ae",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "agent": "conversationalAgent",
        "input": "={{ $json.newMessage }}",
        "sessionKey": "={{ $json.conversationId }}",
        "options": {
          "systemMessage": "={{ $json.systemInstruction || 'You are a helpful AI assistant. Continue the conversation naturally based on the context provided. Be concise but helpful.' }}"
        }
      },
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://nzybisigsdwpekepbvfk.supabase.co/rest/v1/messages",
        "headers": {
          "apikey": "YOUR_SUPABASE_SERVICE_KEY",
          "Authorization": "Bearer YOUR_SUPABASE_SERVICE_KEY",
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        "body": {
          "conversation_id": "={{ $json.conversationId }}",
          "content": "={{ $('AI Agent').first().json.output }}",
          "is_user": false,
          "user_id": "={{ $json.user_id }}"
        }
      },
      "name": "Save to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": {
          "success": true,
          "response": "={{ $('AI Agent').first().json.output }}",
          "conversationId": "={{ $json.conversationId }}"
        }
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "Save to Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Save to Supabase": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Step 3: Configure API Keys and Credentials

### OpenAI Configuration (for AI Agent)
1. In the AI Agent node, configure the Chat Model:
   - Click on the **Chat Model** dropdown
   - Select **OpenAI Chat Model**
   - Create new credentials or select existing ones
   - Enter your OpenAI API key
   - Set the model name (e.g., `gpt-4`, `gpt-3.5-turbo`)
   - Test the connection

### Memory Configuration (for AI Agent)
1. In the AI Agent node, configure Memory:
   - Set **Memory Type** to "Buffer Memory" for conversation history
   - Use `{{ $json.conversationId }}` as the **Session Key** to maintain separate conversations
   - Optionally set **Max Token Limit** to control memory usage

### Supabase Configuration
1. In the HTTP Request node (Save to Supabase):
   - Replace `YOUR_SUPABASE_SERVICE_KEY` with your actual service key
   - Make sure both `apikey` and `Authorization` headers use the same key
   - Update the URL to match your Supabase project URL

## Step 4: Test the Workflow

### Test Payload for AI Agent
Send this simplified test payload to your webhook (the AI Agent handles conversation history automatically):

```json
{
  "conversationId": "test-conversation-id",
  "newMessage": "Hello, how are you?",
  "systemInstruction": "You are a helpful AI assistant. Be concise but helpful, and provide accurate information.",
  "user_id": "test-user-id"
}
```

### Test Payload for Legacy Method
If using the manual setup, use this more detailed payload:

```json
{
  "conversationId": "test-conversation-id",
  "messages": [
    {
      "id": "1",
      "conversation_id": "test-conversation-id",
      "content": "Hello, how are you?",
      "is_user": true,
      "created_at": "2024-01-01T00:00:00Z",
      "user_id": "test-user-id"
    },
    {
      "id": "2", 
      "conversation_id": "test-conversation-id",
      "content": "I'm doing well, thank you! How can I help you today?",
      "is_user": false,
      "created_at": "2024-01-01T00:01:00Z",
      "user_id": "test-user-id"
    }
  ],
  "newMessage": "What's the weather like?",
  "systemInstruction": "You are a helpful AI assistant. Be concise but helpful, and provide accurate information.",
  "user_id": "test-user-id"
}
```

### Using curl to test (AI Agent):
```bash
curl -X POST https://n8n.shanetechtools.online/webhook-test/196c293b-915d-4b4e-b70c-35a4f1bad4ae \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-conversation-id",
    "newMessage": "Hello, how are you?",
    "systemInstruction": "You are a creative writing assistant. Help with storytelling and be imaginative.",
    "user_id": "test-user-id"
  }'
```

### Using curl to test (Legacy Method):
```bash
curl -X POST https://n8n.shanetechtools.online/webhook-test/196c293b-915d-4b4e-b70c-35a4f1bad4ae \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-conversation-id",
    "messages": [
      {
        "id": "1",
        "conversation_id": "test-conversation-id", 
        "content": "Hello",
        "is_user": true,
        "created_at": "2024-01-01T00:00:00Z",
        "user_id": "test-user-id"
      }
    ],
    "newMessage": "How are you?",
    "systemInstruction": "You are a creative writing assistant. Help with storytelling and be imaginative.",
    "user_id": "test-user-id"
  }'
```

## Step 5: Activate the Workflow

1. **Save** your workflow
2. **Activate** it using the toggle switch
3. The webhook should now be live and ready to receive requests

## Step 6: Update Mobile App (Already Done)

Your mobile app is already configured to use the webhook URL:
- `lib/config.ts` contains the correct webhook URL
- `lib/chatService.ts` sends the proper payload format

## Troubleshooting

### Common Issues:

1. **AI Agent Node Not Available**
   - Ensure you have the LangChain nodes installed: `@n8n/n8n-nodes-langchain`
   - Update n8n to the latest version
   - Check the Community Nodes section in n8n settings

2. **401 Unauthorized from Supabase**
   - Check your service key is correct
   - Ensure you're using the service_role key, not anon key

3. **OpenAI API Errors**
   - Verify your OpenAI API key in the Chat Model credentials
   - Check you have sufficient credits
   - Ensure the model name is correct (gpt-4 or gpt-3.5-turbo)

4. **Memory/Conversation Issues**
   - Verify the Session Key is set to `{{ $json.conversationId }}`
   - Check that conversation IDs are consistent across requests
   - Monitor memory usage if conversations are very long

5. **Webhook Not Responding**
   - Check the workflow is activated
   - Verify the webhook path matches exactly
   - Look at the execution logs in n8n

6. **Messages Not Saving to Supabase**
   - Check the user_id is being passed correctly
   - Verify RLS policies allow the service key to insert
   - Check the Supabase logs

### Debug Tips:

1. **Enable Debug Mode**: In n8n, you can see the data flowing between nodes
2. **Check Execution Logs**: n8n shows detailed logs for each execution
3. **Test Each Node**: You can execute nodes individually to isolate issues
4. **AI Agent Debugging**: Check the agent's memory and tool usage in the execution logs
5. **Monitor Token Usage**: Keep track of OpenAI token consumption for cost management

## Advanced Features (Optional)

### Add Tools to AI Agent
The AI Agent can use tools to extend its capabilities:

1. **Add Vector Store Tool** for knowledge retrieval:
   - Connect a Supabase Vector Store
   - Enable semantic search of your knowledge base
   - Let the agent retrieve relevant information

2. **Add Calculator Tool** for mathematical operations:
   - Enable the built-in calculator tool
   - Agent can perform calculations automatically

3. **Add Custom Tools** for specific functions:
   - Create HTTP Request tools for API calls
   - Add database query tools
   - Build custom JavaScript tools

### Enhanced Memory Management
Configure advanced memory options:

1. **Token Limit Management**:
   - Set max tokens to prevent context overflow
   - Use conversation summarization for long chats

2. **Memory Types**:
   - **Buffer Memory**: Keeps recent messages
   - **Summary Memory**: Summarizes old conversations
   - **Vector Store Memory**: Semantic memory search

### Add Image Generation
Extend the workflow with DALL-E integration:

1. Add a condition node to detect image requests
2. Use OpenAI DALL-E node for image generation
3. Save image URLs to a new `attachments` table
4. Return image URLs in the response

### Rate Limiting and Security
Implement protection mechanisms:

1. **Rate Limiting**: Track requests per user/conversation
2. **Input Validation**: Sanitize user inputs
3. **Cost Monitoring**: Track OpenAI token usage
4. **User Authentication**: Validate user tokens

## Key Benefits of Using AI Agent Node

### Advantages over Manual Setup:
1. **Built-in Memory Management**: Automatic conversation history handling
2. **Tool Integration**: Easy addition of tools and capabilities
3. **Better Error Handling**: More robust error management
4. **Streaming Support**: Built-in support for streaming responses
5. **Extensibility**: Easy to add new tools and capabilities
6. **Performance**: Optimized for AI workflows

### Migration from Legacy Setup:
If you're currently using the manual setup, consider migrating to the AI Agent approach for:
- Better conversation continuity
- Reduced complexity
- Enhanced capabilities
- Future-proof architecture

## Security Notes

- Never expose your service key in client-side code
- Use environment variables for sensitive data in n8n
- Consider implementing request validation
- Monitor usage and costs regularly
- Set appropriate memory limits to prevent excessive token usage
- Validate and sanitize all user inputs

## Additional Resources

- [n8n LangChain AI Agent Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [LangChain Memory Types](https://js.langchain.com/docs/modules/memory/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase API Reference](https://supabase.com/docs/reference/api)

Your n8n workflow is now ready to handle chat messages from your mobile app and provide intelligent AI responses with advanced conversation management and extensible tool integration!