import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions,
  PanResponder,
  PanResponderInstance,
  ViewStyle,
  StyleProp
} from 'react-native';
import { COLORS } from '../utils/theme';

type ProgressBarProps = {
  progress: number;
  onSeek?: (position: number) => void;
  onSeeking?: (position: number) => void;
  barHeight?: number;
  progressColor?: string;
  backgroundColor?: string;
  handleSize?: number;
  handleColor?: string;
  handleBorderColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  onSeek,
  onSeeking,
  barHeight = 6,
  progressColor = COLORS.primary,
  backgroundColor = COLORS.textSecondary,
  handleSize = 12,
  handleColor = COLORS.primary,
  handleBorderColor = COLORS.textTertiary,
  style
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(progress);
  
  // Créer le PanResponder pour gérer les interactions tactiles
  const panResponder: PanResponderInstance = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsSeeking(true);
      setSeekPosition(progress);
    },
    onPanResponderMove: (_, gestureState) => {
      const { moveX } = gestureState;
      const progressBarWidth = Dimensions.get('window').width;
      let position = moveX / progressBarWidth;
      
      // Limiter la position entre 0 et 1
      position = Math.max(0, Math.min(1, position));
      
      setSeekPosition(position);
      
      // Notifier le parent pendant le seeking
      if (onSeeking) {
        onSeeking(position);
      }
    },
    onPanResponderRelease: () => {
      if (onSeek) {
        onSeek(seekPosition);
      }
      setIsSeeking(false);
    },
  });

  // Calculer la position actuelle (soit en seeking, soit la progression normale)
  const currentPosition = isSeeking ? seekPosition : progress;

  return (
    <View 
      style={[
        styles.progressBar,
        { height: barHeight, backgroundColor },
        style
      ]}
      {...panResponder.panHandlers}
    >
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${currentPosition * 100}%`,
            backgroundColor: progressColor,
            height: barHeight
          }
        ]} 
      />
      <View 
        style={[
          styles.progressHandle, 
          { 
            left: `${currentPosition * 100}%`,
            width: handleSize,
            height: handleSize,
            borderRadius: handleSize / 2,
            backgroundColor: handleColor,
            borderColor: handleBorderColor,
            top: (barHeight - handleSize) / 2,
            marginLeft: -handleSize / 2
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressBar: {
    width: '100%',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressHandle: {
    position: 'absolute',
    borderWidth: 2,
  },
});
