import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export default function KeyboardSafeScroll({
  children,
  style,
  contentContainerStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const restingHeight = useRef(windowHeight);
  const [androidKeyboardPad, setAndroidKeyboardPad] = useState(0);

  useEffect(() => {
    if (windowHeight > restingHeight.current) {
      restingHeight.current = windowHeight;
    }
  }, [windowHeight]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      const windowAlreadyResized =
        restingHeight.current - windowHeight > event.endCoordinates.height * 0.4;
      setAndroidKeyboardPad(
        windowAlreadyResized ? 0 : event.endCoordinates.height
      );
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardPad(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [windowHeight]);

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { flexGrow: 1 },
          contentContainerStyle,
          {
            paddingBottom:
              Math.max(insets.bottom, 16) + 120 + androidKeyboardPad,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        automaticallyAdjustsScrollIndicatorInsets
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
