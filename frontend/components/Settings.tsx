import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, StatusBar, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { logout } from '@/utils/auth';
import { deleteAccount, API_BASE_URL } from '@/utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemePreference, ThemePreference } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BlockedUsersList from '@/components/BlockedUsersList';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44;
const SUPPORT_EMAIL = 'cole.garrison.005@gmail.com';

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [blockedVisible, setBlockedVisible] = React.useState(false);
  const translateX = React.useRef(new Animated.Value(width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'tabIconDefault');
  const primary = useThemeColor({}, 'primary');
  const { preference, setPreference } = useThemePreference();

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteAccount();
            if (!res.ok) { Alert.alert('Error', res.error || 'Failed to delete account'); return; }
            onClose();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!visible) return null;

  const SettingsItem = ({
    icon,
    title,
    onPress,
    color = textColor,
    iconColor = textColor,
    showBorder = true,
  }: {
    icon: string;
    title: string;
    onPress: () => void;
    color?: string;
    iconColor?: string;
    showBorder?: boolean;
  }) => (
    <TouchableOpacity 
      style={[
        styles.item, 
        showBorder && { borderBottomColor: borderColor + '20' }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <Text style={[styles.itemText, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={borderColor} />
    </TouchableOpacity>
  );

  return (
    <>
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        { opacity: fadeAnim }
      ]}
    >
      {/* Full-screen backdrop with blur effect; fades in place */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
      </TouchableOpacity>

      {/* Settings Panel; slides in from the right */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor,
            width: width * 0.75,
            transform: [{ translateX }, { scale: scaleAnim }],
            paddingTop: STATUS_BAR_HEIGHT + 20,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: textColor + '80' }]}>Manage your preferences</Text>
          </View>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: borderColor + '15' }]} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Settings Items */}
        <View style={styles.content}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor + '60' }]}>ACCOUNT</Text>
            <View style={[styles.sectionContent, { backgroundColor: backgroundColor, borderColor: borderColor + '20' }]}>
              <SettingsItem
                icon="person-outline"
                title="Profile"
                onPress={() => {
                  onClose();
                  router.push('/profile');
                }}
              />
              <SettingsItem
                icon="ban-outline"
                title="Blocked Users"
                onPress={() => setBlockedVisible(true)}
              />
            </View>
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor + '60' }]}>APPEARANCE</Text>
            <View style={[styles.segmentRow, { backgroundColor: backgroundColor, borderColor: borderColor + '20' }]}>
              {([
                { pref: 'light', icon: 'sunny-outline', title: 'Light' },
                { pref: 'dark', icon: 'moon-outline', title: 'Dark' },
                { pref: 'system', icon: 'phone-portrait-outline', title: 'System' },
              ] as { pref: ThemePreference; icon: string; title: string }[]).map((option) => {
                const selected = preference === option.pref;
                return (
                  <TouchableOpacity
                    key={option.pref}
                    style={[styles.segment, selected && { backgroundColor: primary + '15' }]}
                    onPress={() => setPreference(option.pref)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={option.icon as any} size={16} color={selected ? primary : textColor + '80'} />
                    <Text style={[styles.segmentText, { color: selected ? primary : textColor + '80' }]}>{option.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor + '60' }]}>SUPPORT</Text>
            <View style={[styles.sectionContent, { backgroundColor: backgroundColor, borderColor: borderColor + '20' }]}>
              <SettingsItem
                icon="shield-checkmark-outline"
                title="Privacy Policy"
                onPress={() => Linking.openURL(`${API_BASE_URL}/privacy`)}
              />
              <SettingsItem
                icon="mail-outline"
                title="Contact Us"
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                showBorder={false}
              />
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <View style={[styles.sectionContent, { backgroundColor: backgroundColor, borderColor: '#d9534f20' }]}>
              <SettingsItem
                icon="log-out-outline"
                title="Sign Out"
                onPress={handleLogout}
                color="#d9534f"
                iconColor="#d9534f"
                showBorder={true}
              />
              <SettingsItem
                icon="trash-outline"
                title="Delete Account"
                onPress={handleDeleteAccount}
                color="#d9534f"
                iconColor="#d9534f"
                showBorder={false}
              />
            </View>
          </View>

          {/* App version */}
          <Text style={[styles.version, { color: textColor + '50', paddingBottom: insets.bottom + 16 }]}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>

    {blockedVisible && (
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 1001 }]}>
        <BlockedUsersList onClose={() => setBlockedVisible(false)} />
      </View>
    )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    borderTopLeftRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  version: {
    marginTop: 'auto',
    paddingBottom: 16,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Settings;