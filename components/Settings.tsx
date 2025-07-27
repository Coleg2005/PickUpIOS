import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { logout } from '@/utils/auth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44;

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const translateX = React.useRef(new Animated.Value(width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'tabIconDefault');

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

  if (!visible) return null;

  const SettingsItem = ({ 
    icon, 
    title, 
    onPress, 
    color = textColor, 
    iconColor = textColor,
    showBorder = true 
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
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        { 
          transform: [{ translateX }], 
          paddingBottom: TAB_BAR_HEIGHT,
          opacity: fadeAnim 
        }
      ]}
    >
      {/* Backdrop with blur effect */}
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose} 
        activeOpacity={1}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
      </TouchableOpacity>
      
      {/* Settings Panel */}
      <Animated.View 
        style={[
          styles.panel,
          {
            height: height - TAB_BAR_HEIGHT,
            backgroundColor,
            width: width * 0.75,
            transform: [{ scale: scaleAnim }],
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
                icon="notifications-outline"
                title="Notifications"
                onPress={() => console.log('Notifications')}
              />
              <SettingsItem
                icon="shield-checkmark-outline"
                title="Privacy & Security"
                onPress={() => console.log('Privacy')}
                showBorder={false}
              />
            </View>
          </View>

          {/* App Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor + '60' }]}>APP</Text>
            <View style={[styles.sectionContent, { backgroundColor: backgroundColor, borderColor: borderColor + '20' }]}>
              <SettingsItem
                icon="color-palette-outline"
                title="Appearance"
                onPress={() => console.log('Appearance')}
              />
              <SettingsItem
                icon="help-circle-outline"
                title="Help & Support"
                onPress={() => console.log('Help')}
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
                showBorder={false}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flexDirection: 'row',
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
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
});

export default Settings;