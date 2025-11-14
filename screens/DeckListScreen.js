import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DeckCard from '../components/DeckCard';
import { loadDecks, saveDecks, loadCards, saveCards } from '../utils/storage';

const DeckListScreen = ({ navigation }) => {
  const [decks, setDecks] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const loadedDecks = await loadDecks();
      const loadedCards = await loadCards();
      setDecks(loadedDecks || []);
      setCards(loadedCards || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setDecks([]);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const getCardCount = (deckId) => {
    return cards.filter((card) => card.deckId === deckId).length;
  };

  const handleDeleteDeck = (deck) => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.name}"? This will also delete all cards in this deck.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedDecks = decks.filter((d) => d.id !== deck.id);
            const allCards = await loadCards();
            const updatedCards = allCards.filter((c) => c.deckId !== deck.id);
            await saveDecks(updatedDecks);
            await saveCards(updatedCards);
            setDecks(updatedDecks);
            setCards(updatedCards);
          },
        },
      ]
    );
  };

  const handleDeckPress = (deck) => {
    navigation.navigate('DeckDetail', { deck });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <Text style={styles.title}>My Decks</Text>
        <Text style={styles.subtitle}>Create and manage your flashcard decks</Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading...</Text>
        </View>
      ) : decks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={80} color="#4b5563" />
          <Text style={styles.emptyStateText}>No decks yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first deck to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeckCard
              deck={item}
              cardCount={getCardCount(item.id)}
              onPress={() => handleDeckPress(item)}
              onDelete={() => handleDeleteDeck(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateDeck')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 20,
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default DeckListScreen;
