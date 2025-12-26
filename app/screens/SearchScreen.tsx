/**
 * SearchScreen - Interface for querying where a lost object is.
 * 
 * Allows user to:
 * - Select or input object type
 * - Set time window for search
 * - Trigger inference
 * - View ranked results with confidence
 * 
 * Non-goals:
 * - Complex filters (only object type and time matter)
 * - Real-time results (batch inference only)
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, TextInput, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTraceStore } from '../../_utils/state/traceStore';
import { useInference } from '../../_utils/hooks/useInference';
import { ConfidenceBadge } from '../../_components/ConfidenceBadge';
import type { LossQuery, CandidateZone } from '../../_utils/types/domain';

interface SearchScreenProps {
  onNavigateBack: () => void;
  onSelectZone: (zone: CandidateZone) => void;
}

/**
 * Object type selector component.
 * 
 * Common objects are suggested based on user priors.
 * Free text input also allowed for custom objects.
 */
const ObjectSelector: React.FC<{
  selected: string;
  onSelect: (type: string) => void;
  suggestions: string[];
}> = ({ selected, onSelect, suggestions }) => {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          color: '#9A9A9A',
          fontWeight: '500',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        What are you looking for?
      </Text>

      {/* Text input for custom object */}
      <TextInput
        placeholder="e.g., keys, wallet, phone"
        value={selected}
        onChangeText={onSelect}
        placeholderTextColor="#9A9A9A"
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#E6E6E6',
          fontSize: 15,
          color: '#111111',
          marginBottom: 12,
        }}
      />

      {/* Quick suggestions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {suggestions.map((obj, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => onSelect(obj)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: selected === obj ? '#111111' : '#F7F7F7',
              borderWidth: 1,
              borderColor: selected === obj ? '#111111' : '#E6E6E6',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: selected === obj ? '#FFFFFF' : '#111111',
                fontWeight: selected === obj ? '600' : '500',
              }}
            >
              {obj}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Time window selector.
 * 
 * Allows user to choose how far back to search.
 * Maps to minutes/hours for clarity.
 */
const TimeWindowSelector: React.FC<{
  selected: number;
  onSelect: (ms: number) => void;
}> = ({ selected, onSelect }) => {
  const windows = [
    { label: '15 min', value: 15 * 60 * 1000 },
    { label: '1 hour', value: 60 * 60 * 1000 },
    { label: '3 hours', value: 3 * 60 * 60 * 1000 },
    { label: 'Today', value: 24 * 60 * 60 * 1000 },
  ];

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          color: '#9A9A9A',
          fontWeight: '500',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Time window
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {windows.map((window, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => onSelect(window.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: selected === window.value ? '#111111' : '#F7F7F7',
              borderWidth: 1,
              borderColor: selected === window.value ? '#111111' : '#E6E6E6',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: selected === window.value ? '#FFFFFF' : '#111111',
                fontWeight: selected === window.value ? '600' : '500',
              }}
            >
              {window.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Result card for a ranked candidate zone.
 * 
 * Displays zone name, probability, confidence, and reasoning.
 */
const ResultCard: React.FC<{
  zone: CandidateZone;
  rank: number;
  onPress: () => void;
}> = ({ zone, rank, onPress }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 100).duration(300)}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E6E6E6',
      }}
    >
      <TouchableOpacity onPress={onPress}>
        {/* Zone name and rank */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111111' }}>
            #{rank + 1} {zone.zoneName}
          </Text>
          <Text style={{ fontSize: 13, color: '#9A9A9A' }}>
            {Math.round(zone.probability * 100)}% probable
          </Text>
        </View>

        {/* Confidence badge */}
        <View style={{ marginBottom: 8 }}>
          <ConfidenceBadge confidence={zone.confidence} label={`${Math.round(zone.confidence * 100)}% confident`} />
        </View>

        {/* Reasoning */}
        <Text style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 18, marginBottom: 8 }}>
          {zone.reasoning.routineMatch}
        </Text>

        {/* Search radius guidance */}
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: '#F7F7F7',
          }}
        >
          <Text style={{ fontSize: 12, color: '#6B6B6B', fontWeight: '500' }}>
            Search radius: <Text style={{ color: '#111111' }}>{zone.searchRadius}</Text>
          </Text>
        </View>

        {/* Disruption event if available */}
        {zone.reasoning.disruptionEvent && (
          <View
            style={{
              marginTop: 8,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: '#FFF3E0',
              borderLeftWidth: 3,
              borderLeftColor: '#A15C00',
            }}
          >
            <Text style={{ fontSize: 12, color: '#A15C00', fontWeight: '500' }}>
              {zone.reasoning.disruptionEvent.type}: {zone.reasoning.disruptionEvent.description}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * SearchScreen Component.
 * 
 * Responsibilities:
 * - Accept object type and time window input
 * - Trigger inference via hooks
 * - Display ranked results
 * - Navigate to map/details on selection
 * 
 * Assumptions:
 * - Episode and graph are loaded in store
 * - Inference service is fast (< 1s)
 * - Results are deterministic and can be cached
 * 
 * Returns:
 * - Search form and ranked results list
 */
export const SearchScreen: React.FC<SearchScreenProps> = ({ onNavigateBack, onSelectZone }) => {
  const { user } = useTraceStore();
  const { isRunning, candidates, scores, error, inferLossLocation } = useInference();

  const [objectType, setObjectType] = useState('');
  const [timeWindow, setTimeWindow] = useState(1 * 60 * 60 * 1000); // default 1 hour

  // Build suggestions from user priors or defaults.
  const suggestions = user?.objectPriors
    ? Object.keys(user.objectPriors).slice(0, 4)
    : ['Keys', 'Wallet', 'Phone'];

  /**
   * Trigger inference when user has selected object and time window.
   */
  const handleSearch = () => {
    if (!objectType.trim()) {
      return; // Require object type
    }

    const query: LossQuery = {
      queryId: `q_${Date.now()}`,
      objectType: objectType.toLowerCase(),
      lastSeen: Date.now() - timeWindow / 2, // estimate middle of window
      timeWindow,
      createdTime: Date.now(),
      candidates: [],
      status: 'pending',
    };

    inferLossLocation(query);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={onNavigateBack}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        >
          <Text style={{ fontSize: 15, color: '#111111', fontWeight: '500' }}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '500', color: '#111111', marginBottom: 8 }}>
            Find your item
          </Text>
          <Text style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 20 }}>
            Tell us what you're looking for and when you last saw it.
          </Text>
        </View>

        {/* Object selector */}
        <ObjectSelector selected={objectType} onSelect={setObjectType} suggestions={suggestions} />

        {/* Time window selector */}
        <TimeWindowSelector selected={timeWindow} onSelect={setTimeWindow} />

        {/* Search button */}
        <TouchableOpacity
          onPress={handleSearch}
          disabled={isRunning || !objectType.trim()}
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: isRunning || !objectType.trim() ? '#E6E6E6' : '#111111',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: isRunning || !objectType.trim() ? '#9A9A9A' : '#FFFFFF',
              fontWeight: '500',
            }}
          >
            {isRunning ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>

        {/* Error state */}
        {error && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: '#FFEBEE',
              borderLeftWidth: 3,
              borderLeftColor: '#B3261E',
            }}
          >
            <Text style={{ fontSize: 13, color: '#B3261E', fontWeight: '500' }}>
              Error: {error}
            </Text>
          </View>
        )}

        {/* Results */}
        {candidates.length > 0 && (
          <View>
            <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#9A9A9A', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Results
              </Text>
            </View>

            {candidates.map((zone, idx) => (
              <ResultCard
                key={zone.zoneId}
                zone={zone}
                rank={idx}
                onPress={() => onSelectZone(zone)}
              />
            ))}

            {/* Scores summary */}
            {scores && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: '#F7F7F7',
                }}
              >
                <Text style={{ fontSize: 12, color: '#9A9A9A', marginBottom: 6 }}>
                  Behavioral scores for this time period:
                </Text>
                <Text style={{ fontSize: 12, color: '#6B6B6B' }}>
                  Stability: {Math.round(scores.csi * 100)}% | Boundary: {Math.round(scores.bls * 100)}% |
                  Disruption: {Math.round(scores.ads * 100)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* No results state */}
        {!isRunning && candidates.length === 0 && objectType && (
          <View
            style={{
              marginHorizontal: 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: '#F7F7F7',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: '#6B6B6B' }}>
              No zones found. Make sure motion sensing is active.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
