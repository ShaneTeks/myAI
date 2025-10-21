# Chat App with Supabase & n8n Integration

This app provides a complete chat experience with user authentication, cloud storage, and AI agent integration.

## Features

- ✅ User authentication with Supabase Auth
- ✅ Cloud storage of conversations and messages
- ✅ Row Level Security (RLS) for data protection
- ✅ Remember login functionality
- ✅ n8n integration for AI responses
- ✅ Real-time conversation management

## Setup Instructions

### 1. Supabase Configuration

Your Supabase database is already configured with:
- `conversations` table with RLS policies
- `messages` table with RLS policies
- User-based access control

### 2. n8n Workflow Setup

1. Import the workflow configuration from `n8n-workflow-config.json`
2. Configure the following nodes:
   - **Supabase Node**: Add your Supabase service key
   - **OpenAI Node**: Add your OpenAI API key
   - **Webhook**: Note the webhook URL

3. Update `lib/config.ts` with your n8n webhook URL:
   ```typescript
   n8n: {
     webhookUrl: 'https://YOUR_N8N_DOMAIN/webhook/chat-agent'
   }
   ```

### 3. App Configuration

The app is already configured with:
- Supabase client with persistent sessions
- Authentication provider wrapping the entire app
- Chat service integrated with n8n

### 4. Testing

1. **Authentication**: 
   - Sign up with a new account
   - Verify the "Remember me" functionality works
   - Test sign out and sign back in

2. **Chat Functionality**:
   - Create a new conversation
   - Send messages and verify they're saved to Supabase
   - Check that n8n receives the full conversation context
   - Verify AI responses are saved back to Supabase

3. **Data Security**:
   - Verify users can only see their own conversations
   - Test that RLS policies are working correctly

## Architecture Flow

```
Mobile App → Supabase Auth → User authenticated
     ↓
User sends message → Saved to Supabase → Sent to n8n
     ↓
n8n receives full conversation context → AI processes → Response generated
     ↓
AI response saved to Supabase → Returned to mobile app
```

## Key Files

- `lib/supabase.ts` - Supabase client configuration
- `lib/authService.ts` - Authentication methods
- `lib/chatService.ts` - Chat operations and n8n integration
- `hooks/useAuth.ts` - Authentication state management
- `hooks/useChat.ts` - Chat state management
- `components/LoginScreen.tsx` - Login/signup interface
- `components/AuthProvider.tsx` - Authentication wrapper
- `n8n-workflow-config.json` - n8n workflow configuration

## Environment Variables

Update these in `lib/config.ts`:
- Supabase URL and anon key (already configured)
- n8n webhook URL (needs your domain)

## Next Steps

1. Deploy your n8n workflow
2. Update the webhook URL in the config
3. Test the complete flow
4. Optionally add more AI tools to your n8n workflow (image generation, etc.)