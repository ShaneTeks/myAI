# N8N TTS Workflow Specification

## Webhook Input
The n8n webhook should expect a POST request with the following JSON payload:

```json
{
  "text": "The message content to convert to speech",
  "messageId": "uuid-of-the-message",
  "conversationId": "uuid-of-the-conversation"
}
```

## Workflow Steps
1. **Receive Webhook Data**: Extract text, messageId, and conversationId
2. **Check for Existing File**: Check if file already exists at `audio-files/tts/{conversationId}/{messageId}.mp3`
3. **Generate Audio** (only if file doesn't exist): Use TTS service to convert text to audio
4. **Upload to Supabase Storage** (only if file doesn't exist): 
   - Create filename: `tts/{conversationId}/{messageId}.mp3`
   - Upload the generated audio file to Supabase Storage bucket `audio-files`
   - Use "upsert" or check for existence to avoid duplicate errors
5. **Return Response**: Send JSON response with the audio URL (whether existing or newly created)

## Expected Response
The webhook should return a JSON response (currently returns as array):

```json
[{
  "success": "true",
  "audioUrl": "audio-files/tts/conversation-id/message-id.mp3",
  "messageId": "uuid-of-the-message"
}]
```

**Note**: The app will automatically convert the relative `audioUrl` path to a full Supabase Storage URL:
`https://nzybisigsdwpekepbvfk.supabase.co/storage/v1/object/public/audio-files/tts/conversation-id/message-id.mp3`

## Error Response
In case of errors:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "messageId": "uuid-of-the-message"
}
```

## Supabase Storage Setup
1. Create a storage bucket named `audio-files`
2. Set bucket to public read access
3. Configure appropriate RLS policies if needed
4. Organize files in folder structure: `tts/{conversationId}/{messageId}.mp3`

## Benefits of This Approach
- ✅ Audio files are cached permanently
- ✅ No regeneration needed for repeated playback
- ✅ No duplicate file errors - checks existence first
- ✅ Reliable file hosting via Supabase Storage
- ✅ Organized file structure for easy management
- ✅ Public URLs work directly with React Native Audio
- ✅ Reduced API calls and faster playback
- ✅ Smart caching: checks DB → checks file existence → generates only if needed