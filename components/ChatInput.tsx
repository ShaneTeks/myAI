import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPlusPress?: () => void;
  onMicPress?: () => void;
  onAudioPress?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  onPlusPress,
  onMicPress,
  onAudioPress,
  disabled = false,
  placeholder = "Message...",
}: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const hasText = value.trim().length > 0;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };



  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused
        ]}
      >
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

        {/* Text input */}
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.chatInputPlaceholder}
          multiline={true}
          maxLength={2000}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          returnKeyType="default"
          autoCorrect={false}
          autoCapitalize="sentences"
          underlineColorAndroid="transparent"
          keyboardAppearance="dark"
          showSoftInputOnFocus={true}
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
            // Mic and audio buttons when no text
            <>
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
    alignItems: 'flex-end',
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
    shadowColor: Colors.dark.tint,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    maxHeight: 120,
    minHeight: 42,
    textAlignVertical: Platform.OS === 'android' ? 'top' : 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});