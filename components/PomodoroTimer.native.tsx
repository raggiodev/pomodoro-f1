import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';

const verstappenImage = require('../assets/images/verstappen.jpg');
const f1Animation = require('../assets/images/f1_animation.json');

const POMODORO_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const f1Facts = [
  // Hamilton
  'Lewis Hamilton ha ganado 7 Campeonatos Mundiales de Fórmula 1, igualando el récord de Michael Schumacher.',
  'Lewis Hamilton es el único piloto negro en la historia de la Fórmula 1, y ha sido una voz activa contra el racismo en el deporte.',
  'Lewis Hamilton posee el récord absoluto de pole positions en F1, con más de 100 clasificaciones en primer lugar.',
  'Lewis Hamilton debutó en 2007 con McLaren y casi gana el campeonato en su temporada de novato.',
  'Lewis Hamilton es vegano y defensor de los derechos de los animales y el medio ambiente.',
  'Lewis Hamilton fundó la comisión Hamilton para promover la diversidad en el automovilismo.',
  
  // Leclerc
  'Charles Leclerc corre para la Scuderia Ferrari desde 2019.',
  'Charles Leclerc es el primer piloto monegasco en ganar un Gran Premio desde Louis Chiron en 1931.',
  'Charles Leclerc ha demostrado ser uno de los mejores clasificadores de su generación.',
  'Charles Leclerc ganó el Campeonato de Fórmula 2 en 2017 de forma dominante.',
  'Charles Leclerc obtuvo su primer triunfo en F1 en el GP de Bélgica 2019, días después de la muerte de su amigo Anthoine Hubert.',
  'Charles Leclerc es conocido por su habilidad en circuitos callejeros como Mónaco y Bakú.',

  // Verstappen
  'Max Verstappen es piloto neerlandés de Red Bull Racing y ha dominado la F1 en los últimos años.',
  'Max Verstappen se convirtió en el ganador más joven de un GP de F1 a los 18 años en España 2016.',
  'Max Verstappen ganó su primer título mundial en 2021 tras una intensa batalla con Hamilton.',
  'Max Verstappen batió el récord de más victorias en una temporada con 19 triunfos en 2023.',
  'Max Verstappen es hijo del ex piloto de F1 Jos Verstappen y de Sophie Kumpen, expiloto de karting.',
  'Max Verstappen tiene una reputación de ser agresivo pero extremadamente talentoso en pista.',

  // Piastri
  'Oscar Piastri es un piloto australiano que corre para McLaren desde 2023.',
  'Oscar Piastri ganó la Fórmula 3 en 2020 y la Fórmula 2 en 2021 en temporadas consecutivas.',
  'Oscar Piastri logró su primer podio en F1 en el Gran Premio de Japón 2023.',
  'Oscar Piastri es considerado uno de los jóvenes talentos más prometedores de la parrilla.',
  'Oscar Piastri reemplazó a Daniel Ricciardo en McLaren tras una controversia contractual con Alpine.',
  'Oscar Piastri fue piloto de reserva de Alpine antes de debutar como titular en F1.'
];

export default function PomodoroTimer({ onStateChange }: { onStateChange?: (isPomodoro: boolean) => void }) {
  const [isMuted, setIsMuted] = useState(false);
  // Para saber si la música está sonando
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPomodoro, setIsPomodoro] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [factIdx, setFactIdx] = useState(0);
  const [factFade] = useState(new Animated.Value(1));
  const factInterval = useRef<NodeJS.Timeout | null>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

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
      if (!soundRef.current) {
        playMusic();
      } else {
        soundRef.current.playAsync();
      }
    } else {
      if (interval.current) clearInterval(interval.current);
      Animated.timing(animValue).stop();
      if (soundRef.current) {
        soundRef.current.pauseAsync();
      }
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
      if (soundRef.current) {
        soundRef.current.pauseAsync();
      }
    };
  }, [isRunning, isMuted, isPomodoro]);

  useEffect(() => {
    if (onStateChange) onStateChange(isPomodoro);

    // Cambia la música al cambiar de modo
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    // Solo reproducir la música del modo actual si está corriendo y no está muteado
    if (isRunning && !isMuted) {
      playMusic();
    }
  }, [isPomodoro]);

  // Cambia el fact automáticamente cada 10 segundos
  useEffect(() => {
    if (factInterval.current) clearInterval(factInterval.current);
    factInterval.current = setInterval(() => {
      nextFact();
    }, 10000);
    return () => {
      if (factInterval.current) clearInterval(factInterval.current);
    };
  }, []);

  // Función para animar y cambiar el fact
  const nextFact = () => {
    Animated.sequence([
      Animated.timing(factFade, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setFactIdx(idx => (idx + 1) % f1Facts.length);
      Animated.timing(factFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };


  const handleSwitch = async () => {
    setIsPomodoro((prev) => !prev);
    setSecondsLeft(isPomodoro ? BREAK_DURATION : POMODORO_DURATION);
    setIsRunning(false);
    stopMusic();
  };

  const playMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (isMuted) {
        setIsMusicPlaying(false);
        return;
      }
      const { sound } = await Audio.Sound.createAsync(
        isPomodoro
          ? require('../assets/music_pomodoro.mp3')
          : require('../assets/music_break.mp3'),
        { shouldPlay: isRunning, isLooping: true, volume: 1, isMuted }
      );
      soundRef.current = sound;
      setIsMusicPlaying(true);
    } catch (e) {}
  };

  // Detener música y actualizar flag
  const stopMusic = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
      setIsMusicPlaying(false);
    }
  };

  // Cuando se toca el botón de mute, detener música inmediatamente si está sonando
  const handleMutePress = async () => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (soundRef.current) {
        soundRef.current.setStatusAsync({ isMuted: newMuted });
      }
      return newMuted;
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
  <SafeAreaView style={[styles.safeArea, { backgroundColor: isPomodoro ? '#F44336' : '#4CAF50' }]}> 
    <StatusBar style="light" translucent backgroundColor="transparent" hidden />
    <TouchableOpacity
      style={styles.muteButton}
      onPress={handleMutePress}
      activeOpacity={0.7}
      accessibilityLabel={isMuted ? 'Activar sonido' : 'Silenciar'}
    >
      <Text style={styles.muteIcon}>{isMuted ? '🔇' : '🔊'}</Text>
    </TouchableOpacity>
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isPomodoro ? 'Pomodoro' : 'Break'} Time!</Text>
      <Animated.View style={{
        transform: [{ scale: animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
        marginBottom: 20
      }}>
        <LottieView source={f1Animation} autoPlay loop style={{ width: 180, height: 180 }} />
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
        <Animated.Text style={[styles.verstappenFact, { opacity: factFade }]}>{f1Facts[factIdx]}</Animated.Text>
      </View>
      <Text style={styles.guadalupe}>For Guadalupe 🏎️</Text>
    </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F44336',
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(50,50,50,0.18)',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  muteIcon: {
    fontSize: 26,
    color: '#888',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
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
