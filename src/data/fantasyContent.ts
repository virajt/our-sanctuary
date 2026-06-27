import { VisualLibraryItem } from "../types";

export const VISUAL_LIBRARY: VisualLibraryItem[] = [
  { id: "whispered-secret", title: "The Whispered Secret", category: "Intimacy", description: "Close, forehead-to-forehead, trading something only the two of you will ever know.", intimacyLevel: "High", mood: "Serene" },
  { id: "horizon-bound", title: "Horizon Bound", category: "Adventure", description: "Shoulder to shoulder, facing the same direction, hands clasped, breathing in rhythm.", intimacyLevel: "Moderate", mood: "Passionate" },
  { id: "convergence", title: "Convergence", category: "Connection", description: "Palms meeting slowly, fingers interlacing, foreheads resting together in silence.", intimacyLevel: "Deep", mood: "Serene" },
  { id: "silent-dialogue", title: "Silent Dialogue", category: "Connection", description: "Seated facing each other, eyes locked, five full breaths with no words at all.", intimacyLevel: "Deep", mood: "Reflective" },
  { id: "quiet-chamber", title: "The Quiet Chamber", category: "Restorative", description: "Fully reclined, wrapped around one another, nowhere to be and nothing to prove.", intimacyLevel: "Mild", mood: "Serene" },
  { id: "slow-descent", title: "Slow Descent", category: "Intimacy", description: "One partner guiding the other down onto soft sheets, unhurried, lips trailing the whole way.", intimacyLevel: "High", mood: "Passionate" },
  { id: "held-still", title: "Held Still", category: "Intimacy", description: "Wrists held gently above the head, weight settled close, nothing moving but breath.", intimacyLevel: "Deep", mood: "Intense" },
  { id: "morning-tangle", title: "Morning Tangle", category: "Restorative", description: "Limbs still tangled from sleep, the first kiss of the day before either of you speaks.", intimacyLevel: "Mild", mood: "Tender" },
];

export const CONVERSATION_PROMPTS = [
  { id: "h1", category: "Hopes", question: "What's a quiet moment in our future you find yourself dreaming about?" },
  { id: "h2", category: "Hopes", question: "How do you hope our relationship feels different a year from now?" },
  { id: "b1", category: "Boundaries", question: "What's a boundary that's actually helped us stay close, not pushed us apart?" },
  { id: "b2", category: "Boundaries", question: "When do you most need space, and how can I tell without you having to say it?" },
  { id: "f1", category: "Fantasies", question: "If we disappeared somewhere with no phones for 48 hours, what would you want to do first?" },
  { id: "f2", category: "Fantasies", question: "Describe a slow evening you'd want us to have, just the two of us, no rush." },
  { id: "g1", category: "Gratitude", question: "What's something small I did recently that made you feel taken care of?" },
  { id: "g2", category: "Gratitude", question: "What's one thing about how we handle hard days together that you're grateful for?" },
  { id: "c1", category: "Connection", question: "What's a memory of us that you go back to when you need to feel close again?" },
  { id: "c2", category: "Connection", question: "What do you wish I asked you about more often?" },
];

// A short, original branching story - intentionally compact (one real
// decision point with two short paths) rather than a long content-authoring
// system, given the scope of everything else in this merge.
export interface StoryStep {
  id: string;
  text: string;
  choices?: { label: string; nextId: string }[];
}

export const STORY_STEPS: Record<string, StoryStep> = {
  root: {
    id: "root",
    text: "Rain on the window, the city gone quiet outside. You've got the evening with no plans and nowhere to be.\n\nDo you stay in, just the two of you - or go find somewhere new together?",
    choices: [
      { label: "Stay in", nextId: "stay-in" },
      { label: "Go out", nextId: "go-out" },
    ],
  },
  "stay-in": {
    id: "stay-in",
    text: "You pull the blankets over, dim the lights, and put on something low and slow. No agenda - just each other's company, hands finding each other without either of you really deciding to.\n\nThis is the kind of night you'll remember for no reason at all, except that it was quiet, and it was yours.",
  },
  "go-out": {
    id: "go-out",
    text: "You grab a coat each and step into the rain anyway, laughing about how unnecessary this is. You end up somewhere small and half-empty, sharing one dessert, knees touching under the table.\n\nThe night doesn't go anywhere in particular - it doesn't need to.",
  },
};
