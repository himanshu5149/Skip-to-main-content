export type ScamTargetType = 'website' | 'phone' | 'email' | 'handle' | 'github' | 'other';
export type ReportStatus = 'pending' | 'verified' | 'rejected';
export type ScamCategory = 'phishing' | 'fraud' | 'impersonation' | 'recruitment' | 'extortion' | 'other';

export interface ScamReport {
  id?: string;
  target: string;
  targetType: ScamTargetType;
  scamType: ScamCategory; // Added
  description: string;
  scamDate?: string;
  reporterId: string;
  reporterEmail?: string;
  reporterName?: string;
  status: ReportStatus;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  evidenceUrls?: string[];
  votesCount: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  isAdmin?: boolean;
  searchHistory?: string[]; // Added for alert system matching
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
  createdAt: any;
  relatedReportId?: string;
}
