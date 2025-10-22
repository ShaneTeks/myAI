# Text-to-Speech Feature Guide

## Overview
The chat app now includes a text-to-speech (TTS) feature that allows users to listen to AI message content. AI message bubbles include a speaker button with the following functionality:

## User Interactions

### Speaker Button States
- **Default (Volume Icon)**: Ready to play audio
- **Loading (Spinner)**: Generating speech from text
- **Playing (Pause Icon)**: Audio is currently playing
- **Paused (Play Icon)**: Audio is paused and can be resumed

### Controls
- **Single Tap**: 
  - Start playing audio (if not playing)
  - Pause audio (if currently playing)
  - Resume audio (if paused)
- **Long Press (800ms)**: Stop audio completely and reset

### Haptic Feedback
- Light haptic feedback on tap
- Medium haptic feedback on long press

## Technical Implementation

### Components
- `SpeakerButton.tsx`: The speaker icon component with state management
- `TextToSpeechService.ts`: Service handling audio generation and playback
- `MessageWithWidgets.tsx`: Updated to include speaker buttons

### API Integration & Caching
- Sends text, messageId, and conversationId to n8n webhook: `https://n8n.shanetechtools.online/webhook-test/cf38a168-ba1a-4aab-95c6-87ef17045b81`
- n8n generates audio and uploads it to Supabase Storage
- Returns JSON response with `audioUrl` pointing to the stored audio file
- Audio URLs are cached in the `messages.audio_url` column for instant replay
- No regeneration needed - audio is generated once and reused forever

### Audio Management & Smart Caching
- Only one audio can play at a time
- Starting new audio automatically stops previous audio
- **Three-tier caching system**:
  1. Check database for cached URL
  2. Check if file exists at expected Supabase Storage URL
  3. Generate via n8n only if file doesn't exist
- Prevents duplicate file generation and storage errors
- Uses expo-av for audio playback

## Features
- ✅ Smooth animations and visual feedback
- ✅ State synchronization across components
- ✅ Error handling for network issues
- ✅ Haptic feedback for better UX
- ✅ Available only for AI messages (user messages don't need TTS)
- ✅ Audio caching - generate once, play anytime
- ✅ Supabase Storage integration for reliable audio hosting
- ✅ Automatic audio cleanup

## Usage Notes
- The speaker button appears on all text messages (both user and AI)
- Visual styling adapts to message type (user vs AI)
- Loading state prevents multiple simultaneous requests
- Long press provides a quick way to stop and reset audio