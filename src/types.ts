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
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  timestamp: string;
}

export interface MatchRecord {
  id: number;
  job: GigItem;
  expiresAt: number; // timestamp ms
  messages: ChatMessage[];
  matchedAt: string;
}

export interface UserProfile {
  name: string;
  role: 'freelancer' | 'business';
  roleTitle: string;
  rateOrBudget: string;
  bio: string;
  skills: string[];
  email: string;
  avatarInitials: string;
  verified: boolean;
  stats: {
    appliedOrPosted: number;
    hired: number;
    ratingOrResponse: string;
  };
}

export type AppScreen = 'startup' | 'auth' | 'roleSelect' | 'explore' | 'matches' | 'messages' | 'profile' | 'admin';
