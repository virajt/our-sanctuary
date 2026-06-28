import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, ChevronRight, CircleHelp, Heart, Flame, ShieldAlert, Sparkles, CircleAlert } from 'lucide-react';
import { ScreenType, StoryStep } from '../types';
import { STORY_STEPS } from '../data';

interface StoryEngineViewProps {
  onNavigate: (screen: ScreenType) => void;
  accentClass: string;
}

export const StoryEngineView: React.FC<StoryEngineViewProps> = ({ onNavigate, accentClass }) => {
  // Game states: 'setup' | 'playing' | 'completed'
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'completed'>('setup');
  
  // Setup variables
  const [selectedMood, setSelectedMood] = useState<'Vulnerable' | 'Playful' | 'Reflective' | 'Strategic'>('Vulnerable');
  const [intensity, setIntensity] = useState<number>(50); // 0-100 slider
  const [selectedDeck, setSelectedDeck] = useState<string>('midnight-echoes');

  // Interactive Play state
  const [currentStepId, setCurrentStepId] = useState<string>('root');
  const [history, setHistory] = useState<string[]>([]);
  const [stepsCount, setStepsCount] = useState<number>(1);

  const currentStep = STORY_STEPS[currentStepId] || STORY_STEPS['root'];

  // Start story
  const handleStartStory = (deckId: string) => {
    setSelectedDeck(deckId);
    setCurrentStepId('root');
    setHistory([]);
    setStepsCount(1);
    setGameState('playing');
  };

  // Select branch
  const handleMakeChoice = (nextStepId: string) => {
    setHistory([...history, currentStepId]);
    const nextStep = STORY_STEPS[nextStepId];
    if (nextStep) {
      setCurrentStepId(nextStepId);
      setStepsCount((prev) => prev + 1);
      if (nextStep.isEnd) {
        setGameState('completed');
      }
    } else {
      // Fallback end if child is missing
      setGameState('completed');
    }
  };

  // Restart
  const handleRestart = () => {
    setGameState('setup');
    setCurrentStepId('root');
    setHistory([]);
    setStepsCount(1);
  };

  // Intensity labels
  const getIntensityLabel = (value: number) => {
    if (value < 35) return { text: 'Gentle', color: 'text-stone-400', desc: 'Comfortable connection thresholds, ideal for wind-downs.' };
    if (value < 75) return { text: 'Profound', color: 'text-[#a855f7]', desc: 'Exquisite emotional focus, opening delicate portals of trust.' };
    return { text: 'Ecstatic', color: 'text-rose-500', desc: 'Highly charged sensory & physical exploration vectors.' };
  };

  const intensityMeta = getIntensityLabel(intensity);

  return (
    <AnimatePresence mode="wait">
      {gameState === 'setup' && (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          {/* Header */}
          <div className="max-w-4xl space-y-4">
            <h1 className="font-display text-4xl text-stone-100 font-extralight tracking-tight">
              Depth & Connection Engine
            </h1>
            <p className="font-sans text-stone-400 text-sm font-light max-w-2xl leading-relaxed">
              Launch highly immersive branching scripts. Select your parameters below as a mutual double-handshake of consent to tune the intensity vector of the narrative.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Col: Setup configurations */}
            <div className="lg:col-span-7 space-y-8">
              {/* Mood parameters */}
              <div className="space-y-4">
                <h3 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">1. Tuning Mood Signature</h3>
                <div className="grid grid-cols-2 gap-3.5">
                  {(['Vulnerable', 'Playful', 'Reflective', 'Strategic'] as const).map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(mood)}
                      className={`flex flex-col items-start p-4 text-left border rounded-xl rounded-b-xl transition-all duration-300 ${
                        selectedMood === mood
                          ? 'bg-stone-950 border-stone-100 text-stone-100 ring-1 ring-stone-100'
                          : 'bg-stone-950/40 border-stone-900 text-stone-500 hover:border-stone-800'
                      }`}
                    >
                      <span className="font-sans text-sm font-medium text-stone-100">{mood}</span>
                      <span className="font-sans text-xs text-stone-500 font-light mt-1">
                        {mood === 'Vulnerable' && 'Delicate disclosures & emotional truths.'}
                        {mood === 'Playful' && 'Mischievous prompts & warm humor.'}
                        {mood === 'Reflective' && 'Shared retrospect & philosophical alignment.'}
                        {mood === 'Strategic' && 'Future alignments & cooperative maps.'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity level */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">2. Emotional Voltage Intensity</h3>
                  <span className={`font-sans text-xs font-mono ${intensityMeta.color} uppercase tracking-wider`}>
                    {intensityMeta.text}
                  </span>
                </div>
                
                <div className="p-5 bg-stone-950 border border-stone-900 rounded-xl space-y-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full h-1 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-stone-200"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-stone-600 uppercase">
                    <span>Gentle</span>
                    <span>Profound</span>
                    <span>Ecstatic</span>
                  </div>
                  <p className="font-sans text-xs text-stone-400 font-light leading-relaxed">
                    {intensityMeta.desc}
                  </p>
                </div>
              </div>

              {/* Recommended feature block */}
              <div className="p-6 bg-[#141312] border border-stone-850 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-4/12 h-36 rounded-lg overflow-hidden relative shrink-0">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj8QfpetSEtVSshBWeAMv0RkhNQO08efAHHpgsfx-cWODIYcnI_uY4GD9_xT7HUfXqKHXQpvZaVqW0i53jTHxnEOUVbMLvJHKlF6tcUV6vtLtTD_znQlkeVZdPexAndl73kl_FjAJ46PNeU2u1E7ECee4_aa4cNjjMC6FtXaK1UiGn80_6HwKXXeIAccvJoAQu8fjEau3vLNlLPXkw0LcwuEkcL5ZM4iI6MA0oxofVWOLv-ZhBuoy2IaoJg5ip5QmPS3GOgxFotadK"
                    alt="Shadow Work"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3.5 flex-1">
                  <div className="flex items-center space-x-1.5 font-mono text-[9px] text-stone-500 uppercase tracking-widest">
                    <Heart size={10} className="text-stone-500" />
                    <span>Highly recommended deck</span>
                  </div>
                  <h4 className="font-display text-lg text-stone-200 font-normal">Featured: Shadow Work</h4>
                  <p className="font-sans text-xs text-stone-400 font-light leading-normal">
                    Explore the unspoken corners of your shared history. This specialized deck is programmed with 14 sensitive branchings about overcoming hurdles in deep sync.
                  </p>
                  <button
                    onClick={() => handleStartStory('shadow-work')}
                    className="flex items-center space-x-1.5 font-sans text-xs text-stone-100 hover:text-stone-300 transition-colors font-medium border-b border-stone-800 pb-0.5"
                  >
                    <span>Launch Shadow Work configuration</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Deck templates */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">3. Choose Script Blueprint</h3>

              <div className="space-y-4">
                {/* Deck 1: Midnight Echoes */}
                <div 
                  onClick={() => handleStartStory('midnight-echoes')}
                  className="group cursor-pointer bg-stone-950 border border-stone-900 rounded-xl p-4 flex items-start space-x-4 hover:border-stone-850 hover:bg-[#121110] transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded overflow-hidden shrink-0 relative">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3tZ4Pg7ay_Ub8mJ-RRmUUdgbBQYb-Q4TUFubTedpw0RYPJ6bdf7jeZu5766tJIw_TT7VvTxr37X7rZAiJ5e16O-BKTgIA7rDoJ5S_EE8rFTnx-yHNsU4VYj7x7rM1WmGTTFH5Gc-EPTP6p1dNMfbXrvxaQm-Vrqohx1NvOSPpeNr5SRO8h_nO7cE4sQUubf9ugq3lfQcgaEyJeKcz4uNoPCkXg2jRUffHzpKjALgCqNvkVkg5BhTqlhjsmX_yP58TOktanPoCa6na"
                      alt="Midnight Echoes"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-medium text-stone-200 group-hover:text-stone-100 transition-colors">Midnight Echoes</h4>
                    <p className="font-sans text-[11px] text-stone-500 font-light leading-normal">
                      A twilight romance script based in Paris. Your choices determine your physical proximity and absolute devotion.
                    </p>
                  </div>
                </div>

                {/* Deck 2: The First Year */}
                <div 
                  onClick={() => handleStartStory('first-year')}
                  className="group cursor-pointer bg-stone-950 border border-stone-900 rounded-xl p-4 flex items-start space-x-4 hover:border-stone-850 hover:bg-[#121110] transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded overflow-hidden shrink-0 relative">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhMyKx8swYnuhfSqMkRtXasM-jIHzr02fr0CFIo5OJSkVDEsyqHYNVKKPkEGQjE_VHL5gQE3_PD6hImIpmE0uNBvZlBDiqvneSgj1AHrTxW3PM8m8Cfk60tW52MWqKfGz3VdIDl-uXa5BUEFbPJldmwKoFVvGHPixR7izY6MqESTPvW9SCX9rcwZ3smbarv2Pj-l1KgQ0zGsgyUgYTTB2PEGJEYJtMdxQ5NiPbD4D9LTPCGiXWQ5lOv_fGN4HkRxxJu9bmmL9JEI6u"
                      alt="The First Year"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-medium text-stone-200 group-hover:text-stone-100 transition-colors">The First Year</h4>
                    <p className="font-sans text-[11px] text-stone-500 font-light leading-normal">
                      Reflect and play through the critical trials, surprises, and early milestones of your connection.
                    </p>
                  </div>
                </div>

                {/* Deck 3: Future Visions */}
                <div 
                  onClick={() => handleStartStory('future-visions')}
                  className="group cursor-pointer bg-stone-950 border border-stone-900 rounded-xl p-4 flex items-start space-x-4 hover:border-stone-850 hover:bg-[#121110] transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded overflow-hidden shrink-0 relative">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4bqzjaI2j0mL1V7JNvR7_H1YcrwX8kRW9tWlZzWnLZekUKMNprVVjKQq9B9kM0kHQazR7cNh7COfYI8jRQN8L768twr-2ba0cr9eZuKbQilIz9AKxE9XrnwhmIC9urNo_fm5eXtROciY0BJqSrYMo3_jWrh5hfhQMSDFc_9QBoaVuJqaspKV0jjAn9w-CnAvlkSW64NRHdTazSc2FPEomzaFUmivmVzI5yZ2VxTdRQu-Fb42ToXeVaPQYkBsKOOPFxh5uh-kKhH2k"
                      alt="Future Visions"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-medium text-stone-200 group-hover:text-stone-100 transition-colors">Future Visions</h4>
                    <p className="font-sans text-[11px] text-stone-500 font-light leading-normal">
                      Fast-forward through long-range projects—building a life, travels, finances, and long-term intimate stability.
                    </p>
                  </div>
                </div>

                {/* Deck 4: Sensual Syntax */}
                <div 
                  onClick={() => handleStartStory('sensual-syntax')}
                  className="group cursor-pointer bg-stone-950 border border-stone-900 rounded-xl p-4 flex items-start space-x-4 hover:border-stone-850 hover:bg-[#121110] transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded overflow-hidden shrink-0 relative">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSDY3ayh3iUmJeqnfK6ViPN5WppavTKTZLYslWUekqpzXswnLtbpzgd1GaA3bHfC8CPU4hHrhHR8aq6Rwvt0ESkru3BGEwSuYFia4xVSPdYX6S4evQx2jEX_oFNETwfhwmr-Gg6AKLgiAzTRhZdKEllnMAeJKtqgteO2jEyOnB7idHn6sM9Pbh9ePHrE6JY3MLucgPallIg8s8h-D931PFaJIWcXT7c3xJC2vWKyd3GoNTuHS8TMZ_w1oitJM0v72pV9qQq6s_CQOW"
                      alt="Sensual Syntax"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-medium text-stone-200 group-hover:text-stone-100 transition-colors">Sensual Syntax</h4>
                    <p className="font-sans text-[11px] text-stone-500 font-light leading-normal">
                      A tactile communication script. Translates complicated boundaries directly into deep mutual agreements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* GAME RUNNING SCREEN */}
      {gameState === 'playing' && (
        <motion.div
          key="playing"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          {/* Progress bar info */}
          <div className="flex items-center justify-between border-b border-stone-900 pb-4">
            <div className="space-y-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#a855f7]">Active Branching</span>
              <h3 className="font-display text-lg text-stone-100 font-light">Midnight Echoes in Paris</h3>
            </div>
            <div className="text-right font-mono text-[10px] text-stone-500">
              <span>Step {stepsCount} of 4</span>
              <div className="h-1.5 w-28 bg-stone-950 rounded-full overflow-hidden mt-1.5 border border-stone-850">
                <div 
                  className={`h-full bg-stone-200`}
                  style={{ width: `${(stepsCount / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Large Scene Image */}
          {currentStep.image && (
            <div className="relative rounded-2xl overflow-hidden border border-stone-850 h-72 md:h-96">
              <img
                src={currentStep.image}
                alt="Scene illustration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter brightness-[0.80] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/25" />
            </div>
          )}

          {/* Narration Block */}
          <div className="p-8 bg-[#141312] border border-stone-850 rounded-2xl space-y-6">
            <p className="font-sans text-stone-300 text-base font-light leading-relaxed whitespace-pre-line select-none">
              {currentStep.text}
            </p>
          </div>

          {/* Choices container */}
          <div className="space-y-3 pt-2">
            {currentStep.choices?.map((choice, cidx) => (
              <button
                key={cidx}
                onClick={() => handleMakeChoice(choice.nextStepId)}
                className="w-full p-4 text-left font-sans text-stone-200 text-sm font-light leading-relaxed bg-stone-950 border border-stone-900 rounded-xl hover:border-stone-800 hover:text-stone-100 transition-all flex items-center justify-between group"
              >
                <span>{choice.text}</span>
                <ChevronRight size={16} className="text-stone-600 group-hover:translate-x-1 group-hover:text-stone-300 transition-colors shrink-0" />
              </button>
            ))}
          </div>

          {/* Utility control */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-900/60 font-mono text-[10px] text-stone-500">
            <button
              onClick={handleRestart}
              className="flex items-center space-x-1.5 hover:text-stone-300 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Abort & reset session cache</span>
            </button>
            <span className="flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full block animate-pulse"></span>
              <span>Double-Handshake verified: Elena + Julian</span>
            </span>
          </div>
        </motion.div>
      )}

      {/* GAME COMPLETED SCREEN */}
      {gameState === 'completed' && (
        <motion.div
          key="completed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-12"
        >
          {/* Paris at Midnight Header banner */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-850 h-80 md:h-[350px]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQTeAddqUSr87D_oGOonGU88F4KDu-mdRmJKWBne-IP6XiW6V2CoyOxm71A9cwi4r9PhnWS86OrvCmdc-W69fNZSMtiIX0rZu0aIva9MtSpr9pGkfzd-qkILNo64adpRlXFRvOvPEeJy0l-QCdXg4jb3G2JHopywvFj8GZXuRT9BmaKY6WwLI39AIE1bwt9qtl_QZ15RZmiIaWhheT_3p9QDqdNq5rJcq8LBsMXD5VAQ3djYT0klq7GX-dOzOTc65_IGFWLtovjJrb"
              alt="Night over Seine"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/10" />
            <div className="absolute inset-x-0 bottom-0 p-8 z-20 space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#d4af37]">Chapter Complete</span>
              <h2 className="font-display text-3xl md:text-4xl text-stone-100 font-extralight tracking-tight">
                {currentStep.endTitle || 'A Night of Quiet Revelations'}
              </h2>
            </div>
          </div>

          {/* Outcome & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-8">
              <div className="p-8 bg-[#141312] border border-stone-850 rounded-2xl space-y-4">
                <p className="font-sans text-stone-300 text-base font-light leading-relaxed">
                  {currentStep.endDescription || 'The story concludes successfully.'}
                </p>
              </div>

              {/* Shared Reflections prompt card */}
              <div className="p-6 bg-stone-950 border border-stone-900 rounded-2xl space-y-5">
                <span className="font-mono text-[9px] text-[#3b82f6] tracking-widest uppercase block">Unification Protocol</span>
                <h4 className="font-sans text-sm font-medium text-stone-200">Shared Reflection Questions</h4>
                <p className="font-sans text-xs text-stone-500 font-light leading-normal">
                  Read these questions out loud to each other. Take as long as you need to respond.
                </p>
                <div className="space-y-3.5 pt-2">
                  <div className="p-4 bg-stone-900/60 border border-stone-900 rounded-xl">
                    <span className="font-sans text-stone-200 text-xs font-light leading-normal block">
                      1. In our session just now, which action felt closest to your authentic self?
                    </span>
                  </div>
                  <div className="p-4 bg-stone-900/60 border border-stone-900 rounded-xl">
                    <span className="font-sans text-stone-200 text-xs font-light leading-normal block">
                      2. If the story continued into our tomorrow, what is one commitment you hope we honor?
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary action */}
              <button
                onClick={handleRestart}
                className={`font-sans text-xs text-stone-950 hover:scale-105 transition-all font-medium py-3 px-6 rounded-xl ${accentClass}`}
              >
                Return to Blueprint Selection
              </button>
            </div>

            {/* Right side: Relates Journeys */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">Related Journeys</h3>
              
              <div className="space-y-4">
                {/* Related deck 1: Echoes of Amalfi */}
                <div className="group bg-stone-950 border border-stone-900 rounded-xl overflow-hidden">
                  <div className="h-28 w-full overflow-hidden relative">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqAt29nGn-N5p3nl24PCMP8Rmj9hd7mly41Qy1AV4J2OpILlh4FnM6KorF2migtSWRKo1JMhpFHb2Nscp49qpC13xHXB5bSPEEzovFg2m-1cpqE6RPDJgRJet8dE_6bmLor571dmCeUusk7lesM_V9nnYhp3xhzDxXGDG2sbgRzhBe4dj_Zk91BiF5bp7-PIOBeKuXUO2bMq-vOUiIjSE-4unnIlFXdi-UfIXwAwsCQuxnLrVg2X0OuNSGqmQygOp_twZ6FcvBbC5w"
                      alt="Amalfi Coast"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-display text-sm text-stone-200">Echoes of Amalfi</h4>
                    <p className="font-sans text-[10px] text-stone-500 font-light block leading-normal">
                      A deep-cohesion coastal script emphasizing ocean rhythm breathing alignments.
                    </p>
                  </div>
                </div>

                {/* Related deck 2: The Highland Mist */}
                <div className="group bg-stone-950 border border-stone-900 rounded-xl overflow-hidden">
                  <div className="h-28 w-full overflow-hidden relative">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGs9CC-Z9lOSkot_B28WMsdm0e7QEhY8uPF4qPNziUCi19SGZ6z6VRD65MO_UDWpc0mwhCITj3zOdys9emS52QXGQBWPnAK3sqjCkLZkHWwpF6KVPHfM_uAtdZQ9yT0JR_7t6XJXLtKeqYXi67M_U9hIS0paxAtXjc-JcQr-1Eu80YyyiQ1N9zf9dTVzR84GXie2jOqSMfHchBcjUW8DFCukD4TinlZ-Qih9ymU7W51ifU30npGKnk5FSSGDgaaCPwhJ0hEJJ9fvYe"
                      alt="Highlands"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-display text-sm text-stone-200">The Highland Mist</h4>
                    <p className="font-sans text-[10px] text-stone-500 font-light block leading-normal">
                      A cozy fireplace script featuring vulnerable letter reviews and cabin dynamics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
