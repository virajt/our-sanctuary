export type ScreenType =
  | 'dashboard'
  | 'visual-library'
  | 'visual-library-detail'
  | 'story-engine'
  | 'conversation-hub'
  | 'security-vault'
  | 'settings'
  | 'privacy';

export interface Pose {
  id: string;
  title: string;
  image: string;
  category: 'intimacy' | 'adventure' | 'connection' | 'restorative';
  description: string;
  intimacyLevel: 'Mild' | 'Moderate' | 'High' | 'Deep';
  difficulty: 'Gentle' | 'Moderate' | 'Advanced';
  primaryMood: 'Serene' | 'Passionate' | 'Playful' | 'Reflective';
  focusArea: string;
  hotspots?: {
    x: number;
    y: number;
    description: string;
  }[];
}

export interface StoryChoice {
  text: string;
  nextStepId: string;
}

export interface StoryStep {
  id: string;
  text: string;
  image?: string;
  choices?: StoryChoice[];
  isEnd?: boolean;
  endTitle?: string;
  endDescription?: string;
}

export interface SecurityLog {
  timestamp: string;
  event: string;
  status: 'Routine' | 'Authorized' | 'Warning' | 'Success';
}

export interface ConversationPrompt {
  id: string;
  category: 'hopes' | 'boundaries' | 'fantasies' | 'gratitude';
  question: string;
}
