import AsyncStorage from '@react-native-async-storage/async-storage';

const DECKS_KEY = '@flashcard_decks';
const CARDS_KEY = '@flashcard_cards';
const REVISIONS_KEY = '@flashcard_revisions';
const ONBOARDING_KEY = '@flashcard_onboarding_completed';

// Deck operations
export const saveDecks = async (decks) => {
  try {
    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error('Error saving decks:', error);
  }
};

export const loadDecks = async () => {
  try {
    const data = await AsyncStorage.getItem(DECKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
};

// Card operations
export const saveCards = async (cards) => {
  try {
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Error saving cards:', error);
  }
};

export const loadCards = async () => {
  try {
    const data = await AsyncStorage.getItem(CARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading cards:', error);
    return [];
  }
};

// Revision operations
export const saveRevisions = async (revisions) => {
  try {
    await AsyncStorage.setItem(REVISIONS_KEY, JSON.stringify(revisions));
  } catch (error) {
    console.error('Error saving revisions:', error);
  }
};

export const loadRevisions = async () => {
  try {
    const data = await AsyncStorage.getItem(REVISIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading revisions:', error);
    return {};
  }
};

export const recordRevision = async (cardId, result) => {
  try {
    const revisions = await loadRevisions();
    const today = new Date().toISOString().split('T')[0];
    
    if (!revisions[cardId]) {
      revisions[cardId] = [];
    }
    
    revisions[cardId].push({
      date: today,
      result: result, // 'correct' or 'incorrect'
    });
    
    await saveRevisions(revisions);
  } catch (error) {
    console.error('Error recording revision:', error);
  }
};

// Onboarding operations
export const getOnboardingStatus = async () => {
  try {
    const data = await AsyncStorage.getItem(ONBOARDING_KEY);
    return data === 'true';
  } catch (error) {
    console.error('Error loading onboarding status:', error);
    return false;
  }
};

export const setOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

