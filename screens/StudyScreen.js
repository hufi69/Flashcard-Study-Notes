import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FlipCard from '../components/FlipCard';
import { recordRevisionWithSpacedRepetition, loadRevisions } from '../utils/storage';

const StudyScreen = ({ navigation, route }) => {
  const { deck, cards: routeCards } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revisions, setRevisions] = useState({});
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, hard: 0, easy: 0 });
  const cards = routeCards || [];
  const statsRef = useRef({ correct: 0, incorrect: 0, hard: 0, easy: 0 });

  useEffect(() => {
    if (!deck || !cards || cards.length === 0) {
      Alert.alert('Error', 'No cards to study', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    loadRevisionData();
  }, []);

  // Sync ref with state
  useEffect(() => {
    statsRef.current = sessionStats;
  }, [sessionStats]);

  const loadRevisionData = async () => {
    const loadedRevisions = await loadRevisions();
    setRevisions(loadedRevisions);
  };

  const handleRate = async (quality) => {
    // Quality: 0 = incorrect, 1 = hard, 2 = medium/good, 3 = easy
    const card = cards[currentIndex];
    if (card) {
      await recordRevisionWithSpacedRepetition(card.id, quality);
      
      const newStats = { ...statsRef.current };
      if (quality === 0) {
        newStats.incorrect += 1;
      } else if (quality === 1) {
        newStats.hard += 1;
        newStats.correct += 1;
      } else if (quality === 2) {
        newStats.correct += 1;
      } else if (quality === 3) {
        newStats.easy += 1;
        newStats.correct += 1;
      }
      
      statsRef.current = newStats;
      setSessionStats(newStats);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Use ref to get latest stats
      const finalStats = statsRef.current;
      showCompletionAlert(finalStats);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const showCompletionAlert = (stats = sessionStats) => {
    const total = stats.correct + stats.incorrect;
    const percentage = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    
    Alert.alert(
      'Study Session Complete!',
      `You reviewed ${total} cards\n${stats.correct} correct (${percentage}%)\n${stats.incorrect} incorrect`,
      [
        {
          text: 'Study Again',
          onPress: () => {
            setCurrentIndex(0);
            const resetStats = { correct: 0, incorrect: 0, hard: 0, easy: 0 };
            statsRef.current = resetStats;
            setSessionStats(resetStats);
          },
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{deck?.name || 'Study'}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.statText}>{sessionStats.correct}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={styles.statText}>{sessionStats.incorrect}</Text>
            </View>
          </View>
        </View>
      </View>

      {cards.length > 0 && cards[currentIndex] ? (
        <FlipCard
          card={cards[currentIndex]}
          currentIndex={currentIndex}
          totalCards={cards.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onRate={handleRate}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No cards available</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 16,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#9ca3af',
  },
});

export default StudyScreen;
