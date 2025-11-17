import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadCards, saveCards, loadDecks, getDueCards } from '../utils/storage';

const DeckDetailScreen = ({ navigation, route }) => {
  const { deck } = route.params;
  const [cards, setCards] = useState([]);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadCardData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadCardData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCardData = async () => {
    const allCards = await loadCards();
    const deckCards = allCards.filter((c) => c.deckId === deck.id);
    setCards(deckCards);
    
    // Calculate due cards
    const dueCards = await getDueCards(deck.id);
    setDueCardsCount(dueCards.length);
  };

  const handleDeleteCard = (card) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const allCards = await loadCards();
            const updatedCards = allCards.filter((c) => c.id !== card.id);
            await saveCards(updatedCards);
            loadCardData();
          },
        },
      ]
    );
  };

  const handleEditCard = (card) => {
    navigation.navigate('CreateCard', { deck, card });
  };

  const filteredCards = cards.filter((card) =>
    card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => handleEditCard(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name="document-text-outline" size={20} color="#06b6d4" />
          </View>
          <Text style={styles.cardQuestion} numberOfLines={2}>
            {item.question}
          </Text>
        </View>
        <Text style={styles.cardAnswer} numberOfLines={1}>
          {item.answer}
        </Text>
        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsIndicator}>
            <Ionicons name="attach" size={14} color="#06b6d4" />
            <Text style={styles.attachmentsText}>
              {item.attachments.length} {item.attachments.length === 1 ? 'attachment' : 'attachments'}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCard(item)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>{deck.name}</Text>
          <View style={styles.headerSubtitleContainer}>
            <Text style={styles.headerSubtitle}>
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </Text>
            {dueCardsCount > 0 && (
              <View style={styles.dueBadge}>
                <Ionicons name="time-outline" size={12} color="#f59e0b" />
                <Text style={styles.dueBadgeText}>{dueCardsCount} due</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.7}
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={24} color="#06b6d4" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CreateDeck', { deck })}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color="#06b6d4" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {cards.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={80} color="#4b5563" />
          <Text style={styles.emptyStateText}>No cards yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add your first card to get started!
          </Text>
        </View>
      ) : filteredCards.length === 0 && searchQuery ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={80} color="#4b5563" />
          <Text style={styles.emptyStateText}>No cards found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.actionButtons}>
        {dueCardsCount > 0 ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.studyDueButton}
              onPress={async () => {
                const dueCards = await getDueCards(deck.id);
                if (dueCards.length === 0) {
                  Alert.alert('No Due Cards', 'All cards are up to date!');
                  return;
                }
                navigation.navigate('Study', { deck, cards: dueCards });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={18} color="#f59e0b" />
              <Text style={styles.studyDueButtonText} numberOfLines={1}>
                Study Due ({dueCardsCount})
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.studyButton}
            onPress={() => {
              if (cards.length === 0) {
                Alert.alert('No Cards', 'Add some cards before studying!');
                return;
              }
              navigation.navigate('Study', { deck, cards });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle" size={22} color="#ffffff" />
            <Text style={styles.studyButtonText} numberOfLines={1}>Study All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateCard', { deck })}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={22} color="#06b6d4" />
            <Text style={styles.addButtonText} numberOfLines={1}>Add Card</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  dueBadgeText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    padding: 0,
  },
  listContent: {
    padding: 16,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardAnswer: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 32,
  },
  attachmentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 32,
    gap: 6,
  },
  attachmentsText: {
    fontSize: 12,
    color: '#06b6d4',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  actionButtons: {
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  studyDueButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    minHeight: 48,
  },
  studyDueButtonText: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '600',
  },
  studyButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 52,
  },
  studyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    minHeight: 52,
  },
  addButtonText: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeckDetailScreen;
