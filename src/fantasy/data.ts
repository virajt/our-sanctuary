import { Pose, ConversationPrompt, SecurityLog, StoryStep } from './types';

export const POSES: Pose[] = [
  {
    id: 'whispered-secret',
    title: 'The Whispered Secret',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArCDpjkr9X1OCIxqXGjLRXuRHX-zAKT8DsQjf-8pWC2Jow1Gtb0dUw1aLs5uAUgzjoeT9jo4XMcK5rEh9xRszyUB9EWuqi_IhpAC3vM8xzE5EEGw3t_TfaRfGxPAt4kwI14b8DzoN9E67BjUB0gYVJCSOBjUXboGUNFjZ75Jc-NKZF_pNHnbwMMk1LhPlf5fcQu0ZLQ3zAnWfNFhX3qy5fS-cK29F6rcXx4BczPI_Ww7gBJa-7u4Mw-LpMXT4zTTUy3vIx2f8kbpvG',
    category: 'intimacy',
    description: 'A close alignment of profiles sharing fragile, spoken secrets in zero ambient noise.',
    intimacyLevel: 'High',
    difficulty: 'Gentle',
    primaryMood: 'Serene',
    focusArea: 'Proximity',
    hotspots: [
      { x: 45, y: 35, description: 'Subtle contact at the neck line for sensory resonance.' },
      { x: 55, y: 55, description: 'Fingertip compression near the chin to establish grounding.' }
    ]
  },
  {
    id: 'horizon-bound',
    title: 'Horizon Bound',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0NVP9zw6yLD50Gp70hcA-4Q_mw_m8oud_QSawysetje-ahnEs8-LY95X-ykJc3_PaPDzCoi0FVm3vaDTRCOgIuZON6xrdwm8-0c2xmBZ0axHlX2ZRujBEpzHnrosn6BF-xYZRUUPaQkKnifmiFd76WLODXDT4eOBkfwmfsptxRfw2WysGMRVklETuKSm2dPOUnd2DHHmMK2MjH-D01EYPwwAikKHuu_Ka6nV6l_DuB8DERqfoa4s0q15PJ3XMOtt0kq1UXWgW127L',
    category: 'adventure',
    description: 'A powerful, shoulder-to-shoulder gaze into the future, aligning breathing patterns and heart rates to build forward momentum.',
    intimacyLevel: 'Moderate',
    difficulty: 'Moderate',
    primaryMood: 'Passionate',
    focusArea: 'Posture',
    hotspots: [
      { x: 30, y: 40, description: 'Parallel shoulder contact points synchronization.' },
      { x: 70, y: 75, description: 'Firm double hand clasping symbolizing shared resilience.' }
    ]
  },
  {
    id: 'convergence',
    title: 'Convergence',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBja2HeOlygOjgn_AGObelY0dIkD8PKrrhsjmxvBcwzPzqJI1nvMJytD5c0BfLbH_iyAeFBhFj0xyBcIj7QFLNbI0SnOP8-2Kja6KfdoETl3kYN918Yykq1TXGVtZsgOoWXromwc5ljqOOCOTVIyfxDQh9nnNPplBF7Z1qVmMwGE07PwYIb_bT8CCpvgjEWd8r39uhJabZJ1a0EAttRiidAQOVYJpmECqcMxIJ5ogI53ZTtfS0jmLjhD1hR17TNViinP7nJyAh4lOZt',
    category: 'connection',
    description: 'Slow-motion meeting of palms and foreheads, closing the electromagnetic loop of communication.',
    intimacyLevel: 'Deep',
    difficulty: 'Gentle',
    primaryMood: 'Serene',
    focusArea: 'Contact Points',
    hotspots: [
      { x: 50, y: 20, description: 'Forehead centering for quiet mental alignment.' },
      { x: 50, y: 65, description: 'Interlaced fingers with slow, pulsing pressure.' }
    ]
  },
  {
    id: 'silent-dialogue',
    title: 'Silent Dialogue',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8bU--NYMfEGaHtJWVW0GZCKO9X4HndCZ4ThaJTqXLd7IbmRu6GUpahI23HoyykEk0HJ382bSKaIRy_Om0TsmOjjtnVlLC_xHU0WWErNRHx8XW1Y5evrfUGd6ttPRmxZktlboQ-KltSZonLKRenQCSRpsYBoHdmSw8OpwAf432LlAgRhbz31ELnux8b2kqrhYa0V7jSdojtQMWhyvyqVn1kk3_DQcqbNaBGzk-IfYsKCMD9FTgsl7N165xnyPIRCtYmQ-5bzFQuGNK',
    category: 'connection',
    description: 'Seated, facing completely open with eyes locked in silence for five complete, uninterrupted rounds of breath.',
    intimacyLevel: 'Deep',
    difficulty: 'Advanced',
    primaryMood: 'Reflective',
    focusArea: 'Gaze / Breath',
    hotspots: [
      { x: 45, y: 30, description: 'Locked pupils, blinking permitted only when synced.' }
    ]
  },
  {
    id: 'quiet-chamber',
    title: 'The Quiet Chamber',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgHSLx1Hr5292R0OZ8ppz-e1Z-4EAe-OONmodrGFIG6uX7ktJhqSPaNlEd5RP52zqqMcWPKIuC7N_OtlGrnlxkCTZcEULwi9s9BvMCCJjgnUDXTDFxmQzgZHQg2O_XxdQpMuRIsah5B1-UBvuAei223bLHx5nl8hYPKzgskoJe_MbG4bEb45WrQf64mjvB1Zt1mKH6o6uwd2PNgVli2BXbM5e_rV33C2HGdoBJ1jsQAe8shXipjuAAq33fMSWRoPr0ZK30NARPjjDV',
    category: 'restorative',
    description: 'A completely reclined restorative pose, wrapping around each other to reduce anxiety and calm the central nervous system.',
    intimacyLevel: 'Mild',
    difficulty: 'Gentle',
    primaryMood: 'Serene',
    focusArea: 'Muscular Release',
    hotspots: [
      { x: 50, y: 50, description: 'Subtle support under lower spine to ease all tension.' }
    ]
  }
];

export const CONVERSATION_PROMPTS: ConversationPrompt[] = [
  { id: 'h1', category: 'hopes', question: 'What is a quiet moment in our future that you dream of returning to?' },
  { id: 'h2', category: 'hopes', question: 'How do you hope our shared sanctuary evolves in the coming season?' },
  { id: 'b1', category: 'boundaries', question: 'What is one boundary you set for yourself that helps keep us connected?' },
  { id: 'b2', category: 'boundaries', question: 'When do you feel we need to take a step back from external noise to protect us?' },
  { id: 'f1', category: 'fantasies', question: 'If we could transport our sanctuary to a remote alpine chalet with no power, how would we spend our first 48 hours?' },
  { id: 'f2', category: 'fantasies', question: 'Describe a slow sensory game you want us to play, involving only whispers and touch.' },
  { id: 'g1', category: 'gratitude', question: 'What is a small, unprompted thing I did recently that made you feel deeply secure?' },
  { id: 'g2', category: 'gratitude', question: 'For which specific attribute under our shared resilience loop are you most grateful?' }
];

export const SECURITY_LOGS: SecurityLog[] = [
  { timestamp: '12:04:15 UTC', event: 'Vault state double handshake completed.', status: 'Success' },
  { timestamp: '11:42:01 UTC', event: 'Partner session heartbeat signal verified.', status: 'Authorized' },
  { timestamp: '09:12:33 UTC', event: 'Local cached story data rotation scheduled.', status: 'Routine' }
];

export const STORY_STEPS: Record<string, StoryStep> = {
  root: {
    id: 'root',
    text: 'A soft mist wraps around the cobblestone alleyways of Saint-Germain-des-Prés. The scent of rain on warm slate stones fills the air. Julian reaches out, his fingertips grazing Elena’s hand as they stand under the limestone archway of a silent, private terrace.\n\n"We can either go inside to the library and warm up by the fire, or take the path leading to the hidden garden of the old abbey," he whispers.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADfgebbpFaKO7UJzmvU7GNG_KeEAlJ4qEs4EAloIsb7kTGo2BWftazo5X0aGPm3zUqxvIL7Mm9G6YcImx63e4zZDX4cT3VzMxehz06vgeU0WkpoRPSKrh1Aqz8PsaYZOvxapAZggub3zd9Q20nkXG5ATC0nPNv-0rumJuyZnNRROz-Ic7fu05j8e1xIEA0FrCxm4_9-r-1YvPrqUZSP3saf6j4KA27Mxz7WanU5MHLzNinu3GbjVRm54MmhvbiPeFpzBzBzxKgvSIk',
    choices: [
      { text: 'Enter the Parisian villa and light the fire', nextStepId: 'villa-fire' },
      { text: 'Walk through the antique garden gate', nextStepId: 'hidden-path' }
    ]
  },
  'villa-fire': {
    id: 'villa-fire',
    text: 'The heavy oak door swings shut, isolating you completely from the noisy streets of Paris. Shadows dance across the high shelves of the leather-bound library. You hear the crackle of wood as the fire springs to life.\n\nElena sits closely on the velvet chaise, looking up. "What are you thinking about right now?"',
    choices: [
      { text: 'Pour a vintage Cabernet and talk about the unspoken desires', nextStepId: 'cabernet-talk' },
      { text: 'Unwrap the private letters we wrote to each other under Amalfi sands', nextStepId: 'amalfi-letters' }
    ]
  },
  'hidden-path': {
    id: 'hidden-path',
    text: 'The metal gate creaks gently as you pass. Lavender and rain-damp ivy fill your senses. Near a weathered marble statue, you find a small alcove lined with dry cushions.\n\n"Listen to the silence of Paris," Elena murmurs, leaning her head against your chest.',
    choices: [
      { text: 'Wrap the coat around her and focus purely on synced breathing', nextStepId: 'synced-breathing' },
      { text: 'Share a deep, slow kiss in the sheltering shadow of the abbey wall', nextStepId: 'abbey-kiss' }
    ]
  },
  'cabernet-talk': {
    id: 'cabernet-talk',
    text: 'With the rich aroma of wine in the air and the fire throwing warm amber light across your skin, all barriers dissolve. Secrets you have never spoken find their way into the room with beautiful, vulnerable clarity.',
    isEnd: true,
    endTitle: 'A Night of Quiet Revelations',
    endDescription: 'The sun rose over the Seine, finding you both still awake, wrapped in blankets on the library floor. There are no secrets left between you, only the warm, unbreakable thread of absolute trust other couples dream of.'
  },
  'amalfi-letters': {
    id: 'amalfi-letters',
    text: 'The faded ink carries the dry, sunny scent of old Mediterranean winds. Reading those intense words under the Parisian rain reignites an explosive physical resonance. The contrast of cold limestone and warm words is electric.',
    isEnd: true,
    endTitle: 'Eternal Convergence',
    endDescription: 'You realized that your story is written across cities and shores, but its heart remains here, in the quiet spaces you construct together. The session concludes with a deep sense of shared destiny.'
  },
  'synced-breathing': {
    id: 'synced-breathing',
    text: 'You close your eyes, counting the rhythm of her chest rising against yours. In, two, three, four. Out, two, three, four. The noise of your fast lives drops away, leaving only this single point of somatic focus.',
    isEnd: true,
    endTitle: 'The Anchored Sanctuary',
    endDescription: 'You achieved complete emotional alignment. No words were required to understand what you both need for the coming season. You feel grounded, safe, and completely renewed.'
  },
  'abbey-kiss': {
    id: 'abbey-kiss',
    text: 'The wet stone arch protects you from the wind. Her fingers dig light tracks into the nape of your neck, pulling you close. It is a slow, timeless meeting that speaks of decades and days all at once.',
    isEnd: true,
    endTitle: 'Unspoken Poetry',
    endDescription: 'The rain of Paris could not touch the warmth you generated in that hidden abbey terrace. You return inside with a deeper, visceral confidence in each other’s physical adoration.'
  }
};
