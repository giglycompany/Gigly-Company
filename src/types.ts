export type GigCategory =
  | 'Designer'
  | 'Social media'
  | 'Coder'
  | 'Marketing'
  | 'Video Editing'
  | 'Data Entry'
  | 'E-Commerce'
  | 'AI Services'
  | 'Writing'
  | 'Videographer/Photographer'
  | 'Event Managment'
  | 'Artist'
  | 'Others';

export const GIG_CATEGORIES: GigCategory[] = [
  'Designer',
  'Social media',
  'Coder',
  'Marketing',
  'Video Editing',
  'Data Entry',
  'E-Commerce',
  'AI Services',
  'Writing',
  'Videographer/Photographer',
  'Event Managment',
  'Artist',
  'Others',
];

export interface GigItem {
  id: string;
  userId?: string;
  rate: string;
  unit: string;
  title: string;
  client: string;
  category: GigCategory;
  tags: string[];
  desc: string;
  posted: string;
  proposals: string;
  hot: boolean;
  avatarBg?: string;
  type?: 'job' | 'candidate';
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  from?: 'me' | 'them';
  text: string;
  timestamp: string;
}

export interface MatchRecord {
  id: number;
  job: GigItem;
  partnerUserId?: string;
  expiresAt: number; // timestamp ms
  messages: ChatMessage[];
  matchedAt: string;
}

export interface SwipeRecord {
  userId: string;
  targetUserId?: string;
  itemId: string;
  direction: 'left' | 'right' | 'up';
  timestamp?: any;
}

export interface UserProfile {
  userId?: string;
  name: string;
  role: 'freelancer' | 'business';
  roleTitle: string;
  rateOrBudget: string;
  category?: string;
  bio: string;
  skills: string[];
  email: string;
  avatarInitials: string;
  verified: boolean;
  profileCompleted?: boolean;
  stats: {
    appliedOrPosted: number;
    hired: number;
    ratingOrResponse: string;
  };
}

export const ADMIN_EMAIL = 'giglycompany@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export type AppScreen =
  | 'startup'
  | 'auth'
  | 'onboarding'
  | 'roleSelect'
  | 'explore'
  | 'matches'
  | 'messages'
  | 'profile'
  | 'admin';
