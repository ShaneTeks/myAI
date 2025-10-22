import { Audio } from 'expo-av';
import { config } from './config';
import { supabase } from './supabase';

export interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
}

export class TextToSpeechService {
  private static sound: Audio.Sound | null = null;
  private static currentMessageId: string | null = null;
  private static listeners: Map<string, (state: TTSState) => void> = new Map();

  static async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  static subscribe(messageId: string, callback: (state: TTSState) => void) {
    this.listeners.set(messageId, callback);
  }

  static unsubscribe(messageId: string) {
    this.listeners.delete(messageId);
  }

  private static notifyListeners(messageId: string, state: TTSState) {
    const callback = this.listeners.get(messageId);
    if (callback) {
      callback(state);
    }
  }

  static async generateAndPlaySpeech(text: string, messageId: string): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAudio();

      this.currentMessageId = messageId;
      this.notifyListeners(messageId, {
        isLoading: true,
        isPlaying: false,
        isPaused: false,
        error: null,
      });

      // Get message data to construct the expected audio URL
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('audio_url, conversation_id')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        console.error('Error fetching message:', fetchError);
        throw new Error('Failed to fetch message data');
      }

      const conversationId = messageData?.conversation_id || 'unknown';
      
      // Construct the expected audio URL
      const expectedAudioPath = `audio-files/tts/${conversationId}/${messageId}.mp3`;
      const expectedAudioUrl = `${config.supabase.url}/storage/v1/object/public/${expectedAudioPath}`;
      
      let audioUrl: string = '';
      let audioExists = false;

      // Check if we have a cached URL in the database
      console.log('Message data:', { 
        messageId, 
        conversationId, 
        hasAudioUrl: !!messageData.audio_url,
        audioUrl: messageData.audio_url 
      });
      
      if (messageData.audio_url) {
        console.log('Found cached audio URL in database:', messageData.audio_url);
        
        // Handle different URL formats that might be stored
        let cachedUrl = messageData.audio_url;
        
        if (cachedUrl.startsWith('http')) {
          // Already a full URL, use as-is
          audioUrl = cachedUrl;
        } else if (cachedUrl.startsWith('audio-files/')) {
          // Relative path from bucket root
          audioUrl = `${config.supabase.url}/storage/v1/object/public/${cachedUrl}`;
        } else if (cachedUrl.startsWith('/storage/v1/object/')) {
          // Partial URL starting with /storage
          audioUrl = `${config.supabase.url}${cachedUrl}`;
        } else {
          // Assume it's a relative path
          audioUrl = `${config.supabase.url}/storage/v1/object/public/${cachedUrl}`;
        }
        
        console.log('Constructed audio URL:', audioUrl);
        audioExists = true;
      }

      // If audio doesn't exist, generate it via n8n
      if (!audioExists) {
        console.log('No cached audio found. Generating new audio via n8n for message:', messageId);
        console.log('Request payload:', { text, messageId, conversationId });
        
        const response = await fetch('https://n8n.shanetechtools.online/webhook-test/cf38a168-ba1a-4aab-95c6-87ef17045b81', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            messageId: messageId,
            conversationId: conversationId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('TTS API Response:', result);
        
        // Handle array response format: [{"success": "true", "audioUrl": "path", "messageId": "id"}]
        let responseData = result;
        if (Array.isArray(result) && result.length > 0) {
          responseData = result[0];
        }
        
        if (!responseData.audioUrl) {
          throw new Error('No audio URL received from TTS service');
        }

        // Convert relative path to full Supabase Storage URL
        let fullAudioUrl = responseData.audioUrl;
        if (!fullAudioUrl.startsWith('http')) {
          fullAudioUrl = `${config.supabase.url}/storage/v1/object/public/${fullAudioUrl}`;
        }
        
        audioUrl = fullAudioUrl;
        console.log('Generated audio URL:', audioUrl);

        // Cache only the relative path in the database (not the full URL)
        let relativePath = responseData.audioUrl;
        
        // Ensure we store only the relative path
        if (relativePath.startsWith('http')) {
          // Extract just the path part after /public/
          const publicIndex = relativePath.indexOf('/storage/v1/object/public/');
          if (publicIndex !== -1) {
            relativePath = relativePath.substring(publicIndex + '/storage/v1/object/public/'.length);
          }
        }
        
        console.log('Caching relative path:', relativePath);
        
        const { error: updateError } = await supabase
          .from('messages')
          .update({ audio_url: relativePath })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error caching new audio URL:', updateError);
        } else {
          console.log('Successfully cached new audio URL');
        }
      }

      // Step 4: Load and play the audio
      console.log('Loading audio from URL:', audioUrl);
      
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, isLooping: false },
          (status) => this.onPlaybackStatusUpdate(status, messageId)
        );

        this.sound = sound;
        
        this.notifyListeners(messageId, {
          isLoading: false,
          isPlaying: true,
          isPaused: false,
          error: null,
        });
      } catch (audioLoadError) {
        console.error('Failed to load cached audio:', audioLoadError);
        
        // If cached audio fails and we haven't tried generating new audio, try that
        if (audioExists) {
          console.log('Cached audio failed, trying to generate new audio via n8n...');
          
          // Clear the bad cached URL from database
          await supabase
            .from('messages')
            .update({ audio_url: null })
            .eq('id', messageId);
          
          // Recursively call this function to generate new audio
          return this.generateAndPlaySpeech(text, messageId);
        } else {
          // If we already tried generating and it still fails, throw the error
          throw audioLoadError;
        }
      }

    } catch (error) {
      console.error('TTS Error:', error);
      this.notifyListeners(messageId, {
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  static async pauseAudio(): Promise<void> {
    if (this.sound && this.currentMessageId) {
      try {
        await this.sound.pauseAsync();
        this.notifyListeners(this.currentMessageId, {
          isLoading: false,
          isPlaying: false,
          isPaused: true,
          error: null,
        });
      } catch (error) {
        console.error('Error pausing audio:', error);
      }
    }
  }

  static async resumeAudio(): Promise<void> {
    if (this.sound && this.currentMessageId) {
      try {
        await this.sound.playAsync();
        this.notifyListeners(this.currentMessageId, {
          isLoading: false,
          isPlaying: true,
          isPaused: false,
          error: null,
        });
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  }

  static async stopAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        
        if (this.currentMessageId) {
          this.notifyListeners(this.currentMessageId, {
            isLoading: false,
            isPlaying: false,
            isPaused: false,
            error: null,
          });
        }
        
        this.sound = null;
        this.currentMessageId = null;
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }

  static getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  private static onPlaybackStatusUpdate(status: any, messageId: string) {
    console.log('Playback status update:', status);
    
    if (status.isLoaded) {
      if (status.didJustFinish) {
        console.log('Audio playback finished');
        // Audio finished playing
        this.notifyListeners(messageId, {
          isLoading: false,
          isPlaying: false,
          isPaused: false,
          error: null,
        });
        this.sound = null;
        this.currentMessageId = null;
      } else if (status.isPlaying) {
        console.log('Audio is playing, position:', status.positionMillis);
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      this.notifyListeners(messageId, {
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: `Playback error: ${status.error}`,
      });
      this.sound = null;
      this.currentMessageId = null;
    }
  }
}