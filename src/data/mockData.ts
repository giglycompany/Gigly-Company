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

export const CLIENT_REPLIES = [
  "Thanks for reaching out! Can you share a couple of past relevant examples?",
  "Great to connect — what rate were you thinking for this scope?",
  "Sounds great! When could you kick this off?",
  "Appreciate the quick reply! Let's hop on a 15-min sync this week.",
  "Your background looks like a great fit! Sending over the brief now.",
];

export const FREELANCER_REPLIES = [
  "Hi! Yes, I'm available and would love to collaborate on this.",
  "I've worked on similar projects recently — happy to share live links!",
  "My rate fits your range. When is your target completion date?",
  "A 15-min sync sounds perfect. I'm open anytime tomorrow afternoon.",
  "Thanks for reaching out! The project specs match my core skillset perfectly.",
];
