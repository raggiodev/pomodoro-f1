import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
// Platform-safe Lottie wrapper
function LottieWrapper(props: any) {
  if (Platform.OS === 'web') {
    const Lottie = require('lottie-react').default;
    return <Lottie {...props} />;
  } else {
    const Lottie = require('lottie-react-native');
    return <Lottie {...props} />;
  }
}

// You can replace these with actual Verstappen images and F1 animations later
const verstappenImage = require('../assets/images/verstappen.png'); // Placeholder, add an image
const f1Animation = require('../assets/images/f1_animation.json'); // Placeholder, add a Lottie JSON

const POMODORO_DURATION = 25 * 60; // 25 min
const BREAK_DURATION = 5 * 60;     // 5 min

const verstappenFacts = [
  'Max Verstappen is a Dutch F1 driver for Red Bull Racing.',
  'He won his first F1 World Championship in 2021.',
  'Max was born in 1997 and started racing at a young age.',
  'He holds the record for youngest F1 Grand Prix winner.',
  'His car number is 33.'
];

export default function PomodoroTimer({ onStateChange }: { onStateChange?: (isPomodoro: boolean) => void }) {
  const [isPomodoro, setIsPomodoro] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [factIdx, setFactIdx] = useState(0);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    if (isRunning) {
      interval.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleSwitch();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 1000, useNativeDriver: true })
        ])
      ).start();
      playMusic();
    } else {
      if (interval.current) clearInterval(interval.current);
      Animated.timing(animValue).stop();
      stopMusic();
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  useEffect(() => {
    if (onStateChange) onStateChange(isPomodoro);
    setFactIdx(Math.floor(Math.random() * verstappenFacts.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPomodoro]);

  const handleSwitch = async () => {
    setIsPomodoro((prev) => !prev);
    setSecondsLeft(isPomodoro ? BREAK_DURATION : POMODORO_DURATION);
    setIsRunning(false);
  };

  const playMusic = async () => {
    try {
      await stopMusic();
      const { sound } = await Audio.Sound.createAsync(
        isPomodoro
          ? require('../assets/music_pomodoro.mp3')
          : require('../assets/music_break.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      setSound(sound);
    } catch (e) {}
  };

  const stopMusic = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isPomodoro ? '#F44336' : '#4CAF50' }]}> 
      <Text style={styles.title}>{isPomodoro ? 'Pomodoro' : 'Break'} Time!</Text>
      <Animated.View style={{
        transform: [{ scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
        marginBottom: 20
      }}>
        {/* F1 animation placeholder */}
        <LottieWrapper source={f1Animation} autoPlay loop style={{ width: 180, height: 180 }} />
      </Animated.View>
      <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setIsRunning((r) => !r)}>
        <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#333' }]} onPress={handleSwitch}>
        <Text style={styles.buttonText}>Switch</Text>
      </TouchableOpacity>
      <View style={styles.verstappenContainer}>
        <Image source={verstappenImage} style={styles.verstappenImg} />
        <Text style={styles.verstappenFact}>{verstappenFacts[factIdx]}</Text>
      </View>
      <Text style={styles.guadalupe}>For Guadalupe 🏎️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    width: 160,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verstappenContainer: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: '#fff2',
    borderRadius: 20,
    padding: 12,
  },
  verstappenImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  verstappenFact: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  guadalupe: {
    marginTop: 40,
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
