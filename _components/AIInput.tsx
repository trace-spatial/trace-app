import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface AIInputProps {
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string) => void;
  style?: any;
}

// Design tokens from your Trace system
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const COLORS = {
  bg: '#FFFFFF',
  text_primary: '#111111',
  text_secondary: '#6B6B6B',
  text_tertiary: '#9A9A9A',
  bg_secondary: '#F7F7F7',
  divider: '#E6E6E6',
  success: '#2E7D32',
  warning: '#A15C00',
  error: '#B3261E',
};

const FONT_SIZES = {
  xs: 11,
  sm: 13,
  body: 15,
  heading: 18,
  title: 28,
};

export function AIInput({
  placeholder = 'What are you looking for?',
  minHeight = 48,
  maxHeight = 120,
  onSubmit,
  style,
}: AIInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [height, setHeight] = useState(minHeight);
  const textInputRef = useRef<TextInput>(null);
  const sendButtonOpacity = useRef(new Animated.Value(0)).current;

  // Animate send button visibility
  useEffect(() => {
    Animated.timing(sendButtonOpacity, {
      toValue: inputValue.trim() ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [inputValue, sendButtonOpacity]);

  const handleContentSizeChange = (contentHeight: number) => {
    const newHeight = Math.max(
      minHeight,
      Math.min(contentHeight, maxHeight)
    );
    setHeight(newHeight);
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSubmit?.(inputValue);
    setInputValue('');
    setHeight(minHeight);
    if (textInputRef.current) {
      textInputRef.current.setNativeProps({ text: '' });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputContainer,
          { minHeight, maxHeight, height },
        ]}
      >
        <TextInput
          ref={textInputRef}
          style={[styles.input, { height }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text_tertiary}
          value={inputValue}
          onChangeText={setInputValue}
          multiline
          scrollEnabled={height === maxHeight}
          onContentSizeChange={(e) =>
            handleContentSizeChange(e.nativeEvent.contentSize.height)
          }
        />

        {/* Mic Icon */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            { opacity: inputValue.trim() ? 0.4 : 1 },
          ]}
          disabled={!!inputValue.trim()}
        >
          <Ionicons
            name="mic"
            size={18}
            color={COLORS.text_secondary}
          />
        </TouchableOpacity>

        {/* Send Button */}
        <Animated.View
          style={[
            styles.sendButton,
            { opacity: sendButtonOpacity },
            !inputValue.trim() && { pointerEvents: 'none' },
          ]}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.sendButtonTouch}
          >
            <Ionicons
              name="send"
              size={18}
              color={COLORS.success}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: COLORS.bg_secondary,
    borderRadius: 16,
    paddingLeft: SPACING.lg,
    paddingRight: 48,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text_primary,
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.sm,
  },
  iconButton: {
    position: 'absolute',
    right: SPACING.md,
    padding: SPACING.xs,
  },
  sendButton: {
    position: 'absolute',
    right: SPACING.md,
  },
  sendButtonTouch: {
    padding: SPACING.xs,
  },
});
