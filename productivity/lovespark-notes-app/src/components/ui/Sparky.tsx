import React from 'react';
import { Image, StyleSheet, type ImageStyle } from 'react-native';

interface Props {
  size?: number;
  style?: ImageStyle;
}

export function Sparky({ size = 48, style }: Props) {
  return (
    <Image
      source={require('../../../assets/images/sparky.png')}
      style={[styles.image, { width: size, height: size }, style]}
      accessibilityLabel="Sparky — LoveSpark mascot"
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {},
});
