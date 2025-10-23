import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { VoiceButton } from './VoiceButton';

interface MinimalTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend?: () => void;
  onPlusPress?: () => void;
  onMicPress?: () => void;
  onAudioPress?: () => void;
  onVoicePress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isVoiceSupported?: boolean;
}

export default function MinimalTextInput({
  value,
  onChangeText,
  onSend,
  onPlusPress,
  onMicPress,
  onAudioPress,
  onVoicePress,
  placeholder = "Type a message...",
  disabled = false,
  isVoiceSupported,
}: MinimalTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasText = value.trim().length > 0;
  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        {/* Plus button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPlusPress}
          disabled={disabled}
        >
          <View style={styles.plusButton}>
            <Ionicons 
              name="add" 
              size={20} 
              color={Colors.dark.text} 
            />
          </View>
        </TouchableOpacity>

        {/* Text input - keeping exact same properties that work */}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.chatInputPlaceholder}
          editable={!disabled}
          underlineColorAndroid="transparent"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Right side buttons */}
        <View style={styles.rightButtons}>
          {hasText ? (
            // Send button when there's text
            <TouchableOpacity
              style={[styles.iconButton, styles.sendButton]}
              onPress={onSend}
              disabled={disabled || !hasText}
            >
              <Ionicons 
                name="send" 
                size={18} 
                color={Colors.dark.text} 
              />
            </TouchableOpacity>
          ) : (
            // Voice, mic and audio buttons when no text
            <>
              {onVoicePress && (
                <VoiceButton
                  onPress={onVoicePress}
                  disabled={disabled}
                  isSupported={isVoiceSupported}
                />
              )}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onMicPress}
                disabled={disabled}
              >
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color={Colors.dark.icon} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={onAudioPress}
                disabled={disabled}
              >
                <Ionicons 
                  name="volume-high" 
                  size={20} 
                  color={Colors.dark.icon} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.dark.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.chatInputBackground,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.dark.chatInputBorder,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 50,
  },
  inputContainerFocused: {
    borderColor: Colors.dark.tint,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.glass,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: Colors.dark.tint,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.chatInputText,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 42,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});