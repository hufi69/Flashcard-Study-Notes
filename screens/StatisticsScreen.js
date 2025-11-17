import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadDecks, loadCards, loadRevisions } from '../utils/storage';

const StatisticsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    totalSessions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    studyStreak: 0,
    cardsToday: 0,
    cardsThisWeek: 0,
    deckStats: [],
  });

  useEffect(() => {
    loadStatistics();
    const unsubscribe = navigation.addListener('focus', loadStatistics);
    return unsubscribe;
  }, [navigation]);

  const loadStatistics = async () => {
    const decks = await loadDecks();
    const cards = await loadCards();
    const revisions = await loadRevisions();

    // Calculate overall stats
    const totalDecks = decks.length;
    const totalCards = cards.length;
    
    // Calculate revision stats
    let totalCorrect = 0;
    let totalIncorrect = 0;
    const cardIds = new Set();
    
    Object.keys(revisions).forEach((cardId) => {
      const cardRevisions = revisions[cardId];
      cardIds.add(cardId);
      cardRevisions.forEach((rev) => {
        if (rev.result === 'correct') totalCorrect++;
        else totalIncorrect++;
      });
    });

    const totalSessions = cardIds.size;

    // Calculate study streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const studyStreak = calculateStreak(revisions, today);

    // Calculate cards reviewed today and this week
    const cardsToday = getCardsReviewedToday(revisions);
    const cardsThisWeek = getCardsReviewedThisWeek(revisions);

    // Calculate deck-specific stats
    const deckStats = decks.map((deck) => {
      const deckCards = cards.filter((c) => c.deckId === deck.id);
      const deckCardIds = new Set(deckCards.map((c) => c.id));
      
      let deckCorrect = 0;
      let deckIncorrect = 0;
      
      deckCardIds.forEach((cardId) => {
        if (revisions[cardId]) {
          revisions[cardId].forEach((rev) => {
            if (rev.result === 'correct') deckCorrect++;
            else deckIncorrect++;
          });
        }
      });

      const total = deckCorrect + deckIncorrect;
      const successRate = total > 0 ? Math.round((deckCorrect / total) * 100) : 0;

      return {
        id: deck.id,
        name: deck.name,
        cardCount: deckCards.length,
        correct: deckCorrect,
        incorrect: deckIncorrect,
        successRate,
      };
    });

    setStats({
      totalDecks,
      totalCards,
      totalSessions,
      totalCorrect,
      totalIncorrect,
      studyStreak,
      cardsToday,
      cardsThisWeek,
      deckStats,
    });
  };

  const calculateStreak = (revisions, today) => {
    const studyDates = new Set();
    Object.keys(revisions).forEach((cardId) => {
      revisions[cardId].forEach((rev) => {
        studyDates.add(rev.date);
      });
    });

    const sortedDates = Array.from(studyDates).sort().reverse();
    let streak = 0;
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      if (date.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (date.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getCardsReviewedToday = (revisions) => {
    const today = new Date().toISOString().split('T')[0];
    const reviewedCards = new Set();
    
    Object.keys(revisions).forEach((cardId) => {
      const hasToday = revisions[cardId].some((rev) => rev.date === today);
      if (hasToday) reviewedCards.add(cardId);
    });

    return reviewedCards.size;
  };

  const getCardsReviewedThisWeek = (revisions) => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const reviewedCards = new Set();
    
    Object.keys(revisions).forEach((cardId) => {
      const hasThisWeek = revisions[cardId].some((rev) => {
        const revDate = new Date(rev.date);
        return revDate >= weekAgo;
      });
      if (hasThisWeek) reviewedCards.add(cardId);
    });

    return reviewedCards.size;
  };

  const totalAnswered = stats.totalCorrect + stats.totalIncorrect;
  const overallSuccessRate = totalAnswered > 0 
    ? Math.round((stats.totalCorrect / totalAnswered) * 100) 
    : 0;

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
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="book" size={32} color="#06b6d4" />
              <Text style={styles.statValue}>{stats.totalDecks}</Text>
              <Text style={styles.statLabel}>Decks</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={32} color="#6366f1" />
              <Text style={styles.statValue}>{stats.totalCards}</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={32} color="#f59e0b" />
              <Text style={styles.statValue}>{stats.studyStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              <Text style={styles.statValue}>{overallSuccessRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* Study Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityItem}>
                <Ionicons name="today" size={24} color="#06b6d4" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityValue}>{stats.cardsToday}</Text>
                  <Text style={styles.activityLabel}>Cards Today</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <Ionicons name="calendar" size={24} color="#6366f1" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityValue}>{stats.cardsThisWeek}</Text>
                  <Text style={styles.activityLabel}>This Week</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <View style={styles.performanceItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.performanceValue}>{stats.totalCorrect}</Text>
                <Text style={styles.performanceLabel}>Correct</Text>
              </View>
              <View style={styles.performanceItem}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.performanceValue}>{stats.totalIncorrect}</Text>
                <Text style={styles.performanceLabel}>Incorrect</Text>
              </View>
            </View>
            {totalAnswered > 0 && (
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${overallSuccessRate}%` }
                  ]} 
                />
              </View>
            )}
          </View>
        </View>

        {/* Deck Statistics */}
        {stats.deckStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deck Performance</Text>
            {stats.deckStats.map((deck) => (
              <View key={deck.id} style={styles.deckStatCard}>
                <View style={styles.deckStatHeader}>
                  <Text style={styles.deckStatName}>{deck.name}</Text>
                  <Text style={styles.deckStatRate}>{deck.successRate}%</Text>
                </View>
                <View style={styles.deckStatDetails}>
                  <Text style={styles.deckStatText}>
                    {deck.cardCount} cards • {deck.correct} correct • {deck.incorrect} incorrect
                  </Text>
                </View>
                {deck.correct + deck.incorrect > 0 && (
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${deck.successRate}%` }
                      ]} 
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  activityCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityContent: {
    alignItems: 'flex-start',
  },
  activityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  activityLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  performanceCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  performanceItem: {
    alignItems: 'center',
    gap: 8,
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  deckStatCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  deckStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  deckStatRate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  deckStatDetails: {
    marginBottom: 12,
  },
  deckStatText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default StatisticsScreen;

