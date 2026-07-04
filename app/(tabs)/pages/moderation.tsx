import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import Header from '@/components/Header';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';
import { getReports, resolveReport, banUser, unbanUser, modDeleteMessage, modDeleteGame } from '@/utils/api';

type Status = 'pending' | 'resolved' | 'dismissed';

const STATUSES: Status[] = ['pending', 'resolved', 'dismissed'];

export default function Moderation() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('pending');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');
  const danger = useThemeColor({}, 'danger');

  const loadReports = useCallback(async (s: Status) => {
    setLoading(true);
    const res = await getReports(s);
    setReports(res || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports(status);
    }, [status, loadReports])
  );

  const handleResolve = (reportId: string, newStatus: 'resolved' | 'dismissed') => {
    Alert.alert(
      newStatus === 'resolved' ? 'Resolve Report' : 'Dismiss Report',
      `Mark this report as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const res = await resolveReport(reportId, newStatus);
            if (res) loadReports(status);
          },
        },
      ]
    );
  };

  const handleBan = (report: any) => {
    const doBan = async (reason?: string) => {
      const res = await banUser(report.reportedUser._id, reason);
      if (res) loadReports(status);
    };
    if (Platform.OS === 'ios') {
      Alert.prompt(`Ban ${report.reportedUser.username}?`, 'Optionally give a reason.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Ban', style: 'destructive', onPress: (reason?: string) => doBan(reason) },
      ]);
    } else {
      Alert.alert(`Ban ${report.reportedUser.username}?`, 'They will no longer be able to use the app.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Ban', style: 'destructive', onPress: () => doBan() },
      ]);
    }
  };

  const handleUnban = async (report: any) => {
    const res = await unbanUser(report.reportedUser._id);
    if (res) loadReports(status);
  };

  const handleDeleteContent = (report: any) => {
    const isGame = report.contentType === 'game';
    Alert.alert(
      isGame ? 'Delete Game' : 'Delete Message',
      'Permanently remove this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = isGame ? await modDeleteGame(report.contentId) : await modDeleteMessage(report.contentId);
            if (res) Alert.alert('Deleted', 'Content removed.');
          },
        },
      ]
    );
  };

  const renderReport = ({ item }: { item: any }) => (
    <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.md, color: textColor, textTransform: 'capitalize' }}>
          {item.reason.replace(/-/g, ' ')} · {item.contentType}
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.xs, color: subtext }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
        {item.reporter?.username || '[deleted]'} reported{' '}
        <Text
          style={{ color: primary, fontFamily: 'DMSans_600SemiBold' }}
          onPress={() => item.reportedUser && router.push({ pathname: '/(tabs)/pages/user/[userid]', params: { userid: item.reportedUser._id } })}
        >
          {item.reportedUser?.username || '[deleted]'}
        </Text>
        {item.reportedUser?.isBanned ? '  (banned)' : ''}
      </Text>

      {!!item.contentSnapshot && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: textColor, fontStyle: 'italic' }} numberOfLines={4}>
          “{item.contentSnapshot}”
        </Text>
      )}

      {!!item.details && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: textColor }}>
          {item.details}
        </Text>
      )}

      {!!item.moderatorNote && (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
          Note: {item.moderatorNote}
        </Text>
      )}

      {status === 'pending' && item.reportedUser && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
          {item.contentId && item.contentType !== 'user' && (
            <ActionChip label="Delete Content" color={danger} onPress={() => handleDeleteContent(item)} />
          )}
          {item.reportedUser.isBanned ? (
            <ActionChip label="Unban" color={primary} onPress={() => handleUnban(item)} />
          ) : (
            <ActionChip label="Ban User" color={danger} onPress={() => handleBan(item)} />
          )}
          <ActionChip label="Resolve" color={primary} onPress={() => handleResolve(item._id, 'resolved')} />
          <ActionChip label="Dismiss" color={subtext} onPress={() => handleResolve(item._id, 'dismissed')} />
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Header />
      <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={{
              paddingVertical: Spacing.xs,
              paddingHorizontal: Spacing.md,
              borderRadius: Radius.full,
              backgroundColor: status === s ? primary : surface,
              borderWidth: 1,
              borderColor: status === s ? primary : cardBorder,
            }}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: status === s ? '#fff' : subtext, textTransform: 'capitalize' }}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReport}
          contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <Ionicons name="shield-checkmark-outline" size={48} color={subtext} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: subtext, marginTop: Spacing.md }}>
                No {status} reports
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function ActionChip({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ borderWidth: 1, borderColor: color, borderRadius: Radius.full, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md }}
    >
      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color }}>{label}</Text>
    </TouchableOpacity>
  );
}
