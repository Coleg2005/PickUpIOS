import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'harassment',
  'spam',
  'inappropriate-content',
  'impersonation',
  'other',
];

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The user being reported (for message/game reports this is the author/leader)
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentType: {
    type: String,
    enum: ['user', 'game', 'message'],
    required: true
  },
  // The offending game/message; null when reporting a user directly
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Snapshot of the content at report time, so moderators can still review
  // it if the original is deleted (games auto-expire via TTL)
  contentSnapshot: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    enum: REPORT_REASONS,
    required: true
  },
  details: {
    type: String,
    default: '',
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  moderatorNote: {
    type: String,
    default: ''
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Report = mongoose.model('Report', ReportSchema);

export default Report;
