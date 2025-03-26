import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Avatar } from './Avatar';
import { COLORS, SPACING } from '../utils/theme';
import { Profile } from '../types/profile';

interface ProfileItemProps {
  profile: Profile;
  onPress: () => void;
}

export const ProfileItem: React.FC<ProfileItemProps> = ({ profile, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Avatar size={50} disabled avatarIndex={profile.avatar} />
      </View>
      <Typography variant="body" style={styles.name}>{profile.name}</Typography>
      <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  name: {
    flex: 1,
  },
});
