import { GigItem } from '../types';

// Empty datasets - all fake and mock profiles have been purged from the application
export const INITIAL_JOBS: GigItem[] = [];

export const INITIAL_CANDIDATES: GigItem[] = [];

export const FREELANCER_SUGGESTIONS = [
  "I'm interested in this gig! 👋",
  "Here is my portfolio & past work 🚀",
  "What's the timeline & scope for this?",
  "I'm available to start immediately!",
  "Let's discuss rate and milestones",
];

export const BUSINESS_SUGGESTIONS = [
  "Loved your profile! Open for a project? 👋",
  "What's your current weekly availability?",
  "Can you share 1–2 recent work examples?",
  "Let's set up a quick 15-min intro sync 🚀",
  "We have a project ready to kick off ASAP",
];

// Deprecated fallback alias
export const SUGGESTIONS = FREELANCER_SUGGESTIONS;
