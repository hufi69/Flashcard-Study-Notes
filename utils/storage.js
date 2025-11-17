import AsyncStorage from '@react-native-async-storage/async-storage';

const DECKS_KEY = '@flashcard_decks';
const CARDS_KEY = '@flashcard_cards';
const REVISIONS_KEY = '@flashcard_revisions';
const ONBOARDING_KEY = '@flashcard_onboarding_completed';
const USERS_KEY = '@flashcard_users';
const CURRENT_USER_KEY = '@flashcard_current_user';

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

// Spaced Repetition Algorithm (SM-2 simplified)
export const calculateNextReview = (card, quality) => {
  // Quality: 0 = incorrect, 1 = hard, 2 = medium, 3 = easy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!card.spacedRepetition) {
    // First review - initialize
    card.spacedRepetition = {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: today.toISOString().split('T')[0],
    };
  }

  const sr = card.spacedRepetition;
  
  if (quality < 1) {
    // Incorrect - reset
    sr.interval = 1;
    sr.repetitions = 0;
    sr.nextReview = today.toISOString().split('T')[0];
  } else {
    // Update ease factor based on quality
    sr.easeFactor = Math.max(1.3, sr.easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
    
    // Update interval
    if (sr.repetitions === 0) {
      sr.interval = 1;
    } else if (sr.repetitions === 1) {
      sr.interval = 6;
    } else {
      sr.interval = Math.round(sr.interval * sr.easeFactor);
    }
    
    sr.repetitions += 1;
    
    // Calculate next review date
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + sr.interval);
    sr.nextReview = nextDate.toISOString().split('T')[0];
  }
  
  return card;
};

export const recordRevisionWithSpacedRepetition = async (cardId, quality) => {
  try {
    const cards = await loadCards();
    const card = cards.find((c) => c.id === cardId);
    
    if (card) {
      const updatedCard = calculateNextReview(card, quality);
      const updatedCards = cards.map((c) => (c.id === cardId ? updatedCard : c));
      await saveCards(updatedCards);
    }
    
    // Also record in revisions
    await recordRevision(cardId, quality >= 2 ? 'correct' : 'incorrect');
  } catch (error) {
    console.error('Error recording revision with spaced repetition:', error);
  }
};

export const getDueCards = async (deckId = null) => {
  try {
    const cards = await loadCards();
    const today = new Date().toISOString().split('T')[0];
    
    let filteredCards = cards;
    if (deckId) {
      filteredCards = cards.filter((c) => c.deckId === deckId);
    }
    
    return filteredCards.filter((card) => {
      if (!card.spacedRepetition || !card.spacedRepetition.nextReview) {
        return true; // New cards are always due
      }
      return card.spacedRepetition.nextReview <= today;
    });
  } catch (error) {
    console.error('Error getting due cards:', error);
    return [];
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

// Authentication operations
export const registerUser = async (userData) => {
  try {
    const users = await loadUsers();
    
    // Check if email already exists
    const emailExists = users.some((user) => user.email === userData.email);
    if (emailExists) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
    };

    await saveUsers([...users, newUser]);
    return true;
  } catch (error) {
    console.error('Error registering user:', error);
    return false;
  }
};

export const loginUser = async (email, password) => {
  try {
    const users = await loadUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Store current user session
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }

    return null;
  } catch (error) {
    console.error('Error logging in user:', error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Error logging out user:', error);
  }
};

export const getCurrentUser = async () => {
  try {
    const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const isAuthenticated = async () => {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const loadUsers = async () => {
  try {
    const data = await AsyncStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

export const saveUsers = async (users) => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

