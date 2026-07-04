import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '@/components/AppButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';
import { submitReport, ReportReason } from '@/utils/api';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate-content', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  // What is being reported; reportedUser for users, contentId for games/messages
  contentType: 'user' | 'game' | 'message';
  reportedUser?: string;
  contentId?: string;
  targetName?: string;
};

export default function ReportModal({ visible, onClose, contentType, reportedUser, contentId, targetName }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  const reset = () => {
    setReason(null);
    setDetails('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const res = await submitReport({ reportedUser, contentType, contentId, reason, details: details.trim() || undefined });
    setSubmitting(false);
    if (res) {
      handleClose();
      Alert.alert('Report Submitted', 'Thanks for letting us know. Our moderators will review this report.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl }}
      >
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.lg, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xl, color: textColor }}>
              Report {contentType === 'user' ? (targetName || 'User') : contentType === 'game' ? 'Game' : 'Message'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={subtext} />
            </TouchableOpacity>
          </View>

          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
            Why are you reporting this?
          </Text>

          <View style={{ gap: Spacing.xs }}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setReason(r.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  padding: Spacing.sm,
                  borderRadius: Radius.md,
                  borderWidth: 1,
                  borderColor: reason === r.value ? primary : cardBorder,
                }}
              >
                <Ionicons
                  name={reason === r.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={reason === r.value ? primary : subtext}
                />
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.md, color: textColor }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Additional details (optional)"
            placeholderTextColor={subtext}
            multiline
            maxLength={1000}
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: Radius.md,
              padding: Spacing.sm,
              color: textColor,
              minHeight: 60,
              fontFamily: 'DMSans_400Regular',
              fontSize: FontSize.md,
            }}
          />

          <AppButton title="Submit Report" onPress={handleSubmit} variant="danger" loading={submitting} disabled={!reason} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
