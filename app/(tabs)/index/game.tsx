import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Game Screen!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,               // Make View take full screen height
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
    backgroundColor: '#000',  // White background so text shows clearly
  },
  text: {
    fontSize: 20,
    color: '#fff',          // Black text color
  },
});
