import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FlipCard = ({ card, onNext, onPrevious, onRate, currentIndex, totalCards }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
    fadeAnim.setValue(1);
  }, [currentIndex]);

  const flip = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (quality) => {
    // Quality: 0 = incorrect, 1 = hard, 2 = medium, 3 = easy
    await onRate(quality);
    resetCard();
  };

  const resetCard = () => {
    if (isFlipped) {
      flip();
    }
    // Give time for state to update before moving to next
    setTimeout(() => {
      onNext();
    }, 400);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {totalCards}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cardContainer}
        onPress={flip}
        activeOpacity={0.9}
      >
        <Animated.View 
          style={[
            styles.card, 
            isFlipped ? styles.backCard : styles.frontCard,
            { opacity: fadeAnim }
          ]}
        >
          <ScrollView 
            style={styles.cardScrollView}
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            {!isFlipped ? (
              <>
                <View style={styles.iconWrapper}>
                  <Ionicons name="help-circle-outline" size={56} color="#ffffff" />
                </View>
                <Text style={styles.cardLabel}>Question</Text>
                <Text style={styles.cardText}>{card.question}</Text>
                
                {card.attachments && card.attachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    {card.attachments.map((attachment) => (
                      attachment.type === 'image' ? (
                        <View key={attachment.id} style={styles.attachmentImageContainer}>
                          <Image
                            source={{ uri: attachment.uri }}
                            style={styles.attachmentImage}
                            resizeMode="contain"
                          />
                        </View>
                      ) : (
                        <View key={attachment.id} style={styles.attachmentDocumentContainer}>
                          <Ionicons
                            name={attachment.type === 'pdf' ? 'document-outline' : 'document-text-outline'}
                            size={32}
                            color="#ffffff"
                          />
                          <Text style={styles.attachmentDocumentName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                        </View>
                      )
                    ))}
                  </View>
                )}
                
                <View style={styles.flipHint}>
                  <Text style={styles.flipHintText}>Tap to flip</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </View>
              </>
            ) : (
              <>
                <View style={styles.iconWrapper}>
                  <Ionicons name="checkmark-circle-outline" size={56} color="#ffffff" />
                </View>
                <Text style={styles.cardLabel}>Answer</Text>
                <Text style={styles.cardText}>{card.answer}</Text>
                <View style={styles.flipHint}>
                  <Text style={styles.flipHintText}>Tap to flip back</Text>
                  <Ionicons name="arrow-back" size={16} color="#ffffff" />
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.difficultyButtons}>
          <TouchableOpacity
            style={[styles.difficultyButton, styles.incorrectButton]}
            onPress={() => handleRate(0)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={20} color="#ffffff" />
            <Text style={styles.difficultyButtonText}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.difficultyButton, styles.hardButton]}
            onPress={() => handleRate(1)}
            activeOpacity={0.8}
          >
            <Ionicons name="remove-circle" size={20} color="#ffffff" />
            <Text style={styles.difficultyButtonText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.difficultyButton, styles.mediumButton]}
            onPress={() => handleRate(2)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.difficultyButtonText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.difficultyButton, styles.easyButton]}
            onPress={() => handleRate(3)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.difficultyButtonText}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.navigationButtons}>
        {currentIndex > 0 && (
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={onPrevious}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#06b6d4" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        {currentIndex < totalCards - 1 && (
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color="#06b6d4" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  progressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22d3ee',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width - 80,
    height: 420,
    borderRadius: 28,
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  frontCard: {
    backgroundColor: '#6366f1',
  },
  backCard: {
    backgroundColor: '#10b981',
  },
  cardScrollView: {
    flex: 1,
    width: '100%',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    width: '100%',
    paddingVertical: 8,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.95,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 32,
    paddingHorizontal: 8,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    opacity: 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  flipHintText: {
    color: '#ffffff',
    fontSize: 12,
    marginRight: 6,
    fontWeight: '500',
  },
  difficultyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  incorrectButton: {
    backgroundColor: '#ef4444',
  },
  hardButton: {
    backgroundColor: '#f59e0b',
  },
  mediumButton: {
    backgroundColor: '#10b981',
  },
  easyButton: {
    backgroundColor: '#06b6d4',
  },
  difficultyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  navButtonText: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  attachmentsContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  attachmentImageContainer: {
    width: '100%',
    maxHeight: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
  },
  attachmentDocumentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  attachmentDocumentName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FlipCard;

