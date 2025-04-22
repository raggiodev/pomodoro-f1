import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PomodoroTimer from '../components/PomodoroTimer';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <PomodoroTimer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F44336',
  },
});
