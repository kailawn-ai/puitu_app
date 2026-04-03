import React from "react";
import LottieView from "lottie-react-native";
import { View, type StyleProp, type ViewStyle } from "react-native";

const DEFAULT_LOADER = require("../../assets/icons/loader.json");

type LottieLoaderProps = {
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  containerStyle?: StyleProp<ViewStyle>;
  source?: object | number;
};

export function LottieLoader({
  size = 90,
  loop = true,
  autoPlay = true,
  speed = 1,
  containerStyle,
  source = DEFAULT_LOADER,
}: LottieLoaderProps) {
  return (
    <View style={containerStyle}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

export default LottieLoader;
