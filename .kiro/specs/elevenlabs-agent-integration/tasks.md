# Implementation Plan

- [x] 1. Set up environment detection and ElevenLabs service foundation






  - Create environment detection utilities to identify ExpoGO vs prebuilt app
  - Implement basic ElevenLabs service with widget support checking
  - Add ElevenLabs configuration to app config
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 2. Extend database schema for voice sessions






  - Create voice_sessions table migration
  - Extend messages table with voice-related columns (voice_session_id, message_type)
  - Update Supabase types to include voice session models
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 3. Create core voice session components





  - [x] 3.1 Implement VoiceSessionModal component


    - Create modal container for ElevenLabs widget
    - Add smooth animation transitions for modal appearance
    - Implement proper modal controls and close handling
    - _Requirements: 1.1, 5.1, 5.4_

  - [x] 3.2 Implement ElevenLabsWidget wrapper component


    - Create wrapper for ElevenLabs conversational widget
    - Add environment detection and graceful fallbacks
    - Implement error handling and recovery mechanisms
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 3.3 Create VoiceButton component


    - Implement voice activation button for chat interface
    - Add visual states for supported/unsupported environments
    - Follow existing button patterns (SpeakerButton style)
    - _Requirements: 1.1, 4.4_

- [x] 4. Implement ElevenLabs service layer





  - [x] 4.1 Create elevenLabsService.ts with core functionality


    - Implement widget lifecycle management (start/end sessions)
    - Add conversation context preparation for agent
    - Create voice response parsing and widget extraction
    - _Requirements: 2.5, 3.1, 3.4_

  - [x] 4.2 Implement memory synchronization


    - Create context preparation from chat history
    - Implement voice transcript capture and storage
    - Add conversation continuity management
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 5. Extend ChatContext for voice functionality





  - Add voice session state management to existing ChatContext
  - Implement voice session lifecycle methods (start/end/sync)
  - Add environment support detection to context
  - _Requirements: 1.2, 1.4, 3.2, 3.3_

- [x] 6. Integrate voice functionality into chat interface





  - [x] 6.1 Update ChatInput to include VoiceButton


    - Replace existing onAudioPress with voice session functionality
    - Add conditional rendering based on environment support
    - Maintain existing UI patterns and styling
    - _Requirements: 1.1, 4.4_


  - [x] 6.2 Update main chat screen (app/index.tsx)

    - Integrate VoiceSessionModal into chat screen
    - Connect voice button press to modal opening
    - Handle voice session state in main chat flow
    - _Requirements: 1.1, 1.4, 5.1_

- [x] 7. Implement voice message display and storage





  - [x] 7.1 Extend message rendering for voice messages


    - Update MessageWithWidgets to handle voice message types
    - Add voice message indicators and metadata display
    - Maintain existing widget parsing for voice-generated content
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 7.2 Update ChatService for voice message handling


    - Extend addMessage to support voice message types
    - Add voice session linking in message storage
    - Update message retrieval to include voice metadata
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 8. Implement agent capability synchronization






  - Configure ElevenLabs agent with weather and external API access
  - Ensure voice agent has equivalent capabilities to n8n text agent
  - Implement structured response handling for voice-generated widgets
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9. Add error handling and graceful degradation





  - [x] 9.1 Implement environment-specific fallbacks


    - Add informational messages for ExpoGO users
    - Disable voice features gracefully on unsupported platforms
    - Provide clear user feedback about feature availability
    - _Requirements: 4.3, 4.4_

  - [x] 9.2 Add voice session error recovery


    - Implement network error handling during voice sessions
    - Add session interruption recovery mechanisms
    - Ensure conversation state preservation on errors
    - _Requirements: 5.5, 3.2_

- [x] 10. Write comprehensive tests





  - [x] 10.1 Create unit tests for voice services


    - Test environment detection logic
    - Test memory sync functionality
    - Test voice message parsing and storage
    - _Requirements: 3.1, 3.2, 6.1_

  - [x] 10.2 Create integration tests for voice sessions



    - Test voice session lifecycle (start → active → end)
    - Test message synchronization between text and voice modes
    - Test error handling and recovery scenarios
    - _Requirements: 1.2, 1.4, 3.2, 3.3_

- [x] 11. Polish user experience and transitions





  - [x] 11.1 Implement smooth animations and transitions


    - Add smooth modal transitions for voice session opening/closing
    - Implement visual feedback for voice activity states
    - Add loading states and progress indicators
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.2 Add voice session visual feedback


    - Implement voice activity indicators during sessions
    - Add agent response visual feedback
    - Create intuitive session end controls
    - _Requirements: 5.2, 5.4_