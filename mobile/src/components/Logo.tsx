import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import { ODISHA_RANK_LOGO_B64 } from "../assets/logoData";

interface LogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  rounded?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 36, style, rounded = true }) => {
  return (
    <Image
      source={{ uri: ODISHA_RANK_LOGO_B64 }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: rounded ? Math.round(size * 0.22) : 0,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};

export default Logo;
