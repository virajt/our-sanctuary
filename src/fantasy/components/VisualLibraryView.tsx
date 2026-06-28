import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Sparkles, Heart, Compass, Activity, Play, Pause, Circle, ArrowRight } from 'lucide-react';
import { Pose, ScreenType } from '../types';
import { POSES } from '../data';

interface VisualLibraryViewProps {
  onNavigate: (screen: ScreenType) => void;
  selectedPoseId: string | null;
  setSelectedPoseId: (id: string | null) => void;
  accentClass: string;
}

export const VisualLibraryView: React.FC<VisualLibraryViewProps> = ({
  onNavigate,
  selectedPoseId,
  setSelectedPoseId,
  accentClass
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Guided breathing simulation states
  const [isPlayingFlow, setIsPlayingFlow] = useState(false);
  const [flowCycle, setFlowCycle] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [flowProgress, setFlowProgress] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  // Run the beautiful breathing cycle simulator when playing
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingFlow) {
      interval = setInterval(() => {
        setFlowProgress((prev) => {
          if (prev >= 100) {
            setFlowCycle((current) => {
              if (current === 'Inhale') return 'Hold';
              if (current === 'Hold') return 'Exhale';
              return 'Inhale';
            });
            return 0;
          }
          return prev + 2.5; // Controls the speed of the breath cycles (approx 4s per state)
        });
      }, 100);
    } else {
      setFlowProgress(0);
      setFlowCycle('Inhale');
    }
    return () => clearInterval(interval);
  }, [isPlayingFlow]);

  // Categories
  const categories = [
    { id: 'all', label: 'All Poses' },
    { id: 'intimacy', label: 'Intimacy' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'connection', label: 'Connection' },
    { id: 'restorative', label: 'Restorative' }
  ];

  // Filtering
  const filteredPoses = POSES.filter((pose) => {
    const matchesSearch = pose.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pose.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || pose.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedPose = POSES.find((p) => p.id === selectedPoseId);

  return (
    <AnimatePresence mode="wait">
      {!selectedPose ? (
        // LIST VIEW
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          {/* Hero description */}
          <div className="max-w-4xl space-y-4">
            <h1 className="font-display text-4xl text-stone-100 font-extralight tracking-tight">
              Art of Connection
            </h1>
            <p className="font-sans text-stone-400 text-base font-light max-w-2xl leading-relaxed">
              Explore a curated collection of physical frames and artistic alignments, designed to spark somatic synchronicity, safe exploration, and deep tactile intimacy.
            </p>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-900">
            {/* Category horizontal scroll */}
            <div className="flex flex-wrap gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`font-sans text-xs px-4 py-2 border rounded-full transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? `bg-stone-50 text-stone-950 border-stone-50 font-medium`
                      : 'bg-stone-950 text-stone-400 border-stone-900 hover:text-stone-200 hover:border-stone-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Elegant Search bar */}
            <div className="relative md:w-80">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-500">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search sanctuary collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-900/80 rounded-full py-2.5 pl-10 pr-4 text-xs font-sans text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-700 transition-colors"
              />
            </div>
          </div>

          {/* Pose Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPoses.map((pose, index) => (
              <motion.div
                key={pose.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                onClick={() => setSelectedPoseId(pose.id)}
                className="group cursor-pointer bg-[#141312] border border-stone-900 rounded-xl overflow-hidden hover:border-stone-800 transition-all duration-500 flex flex-col justify-between"
              >
                {/* Photo container */}
                <div className="relative h-60 w-full overflow-hidden">
                  <img
                    src={pose.image}
                    alt={pose.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-stone-950/20" />
                  <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-stone-800/80">
                    <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">
                      {pose.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-display text-xl text-stone-100 group-hover:text-stone-300 transition-colors">
                      {pose.title}
                    </h3>
                    <p className="font-sans text-xs text-stone-400 font-light leading-relaxed line-clamp-2">
                      {pose.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-900/60 flex items-center justify-between text-[11px] font-mono text-stone-500">
                    <div className="flex items-center space-x-1.5">
                      <Heart size={12} className="text-stone-600" />
                      <span>{pose.intimacyLevel} Intimacy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Explore guide</span>
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        // DETAIL VIEW WITH HOTSPOTS AND GUIDED BREATHING
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6 }}
          className="space-y-10"
        >
          {/* Breadcrumb nav */}
          <button
            onClick={() => setSelectedPoseId(null)}
            className="flex items-center space-x-2 text-xs font-mono text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Back to Collection</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left side: interactive image with Hotspots */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-stone-850 bg-stone-950">
                {/* Image */}
                <img
                  src={selectedPose.image}
                  alt={selectedPose.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-[450px] object-cover filter brightness-[0.85] contrast-[1.05]"
                />
                
                {/* Hotspots overlay */}
                {selectedPose.hotspots?.map((hs, hidx) => (
                  <div
                    key={hidx}
                    style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-30"
                  >
                    {/* Ring animation */}
                    <button
                      onClick={() => setActiveHotspot(activeHotspot === hidx ? null : hidx)}
                      className="relative flex items-center justify-center w-8 h-8 rounded-full"
                    >
                      <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-stone-200/40 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-stone-100 hover:scale-125 transition-transform shadow-lg shadow-black"></span>
                    </button>

                    {/* Popover content */}
                    {(activeHotspot === hidx) && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-stone-900 border border-stone-800 text-stone-100 font-sans text-xs p-3.5 rounded-lg shadow-2xl backdrop-blur-xl z-50">
                        <div className="font-mono text-[9px] text-[#d4af37] tracking-wider uppercase mb-1">Tactile Guidance</div>
                        <p className="font-light leading-normal">{hs.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="font-sans text-xs text-stone-500 italic">
                  *Click any pulsating white indicator on the portrait above to focus tactile presence instructions.
                </p>
              </div>
            </div>

            {/* Right side: details, metadata & Dynamic Breathing sync flow */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-stone-500 font-mono text-[10px] tracking-wider uppercase">
                  <span>Intimacy Matrix</span>
                  <span>•</span>
                  <span>{selectedPose.category} pose</span>
                </div>
                <h2 className="font-display text-3xl text-stone-100 font-light tracking-tight">{selectedPose.title}</h2>
                <p className="font-sans text-stone-400 text-sm font-light leading-relaxed">{selectedPose.description}</p>
              </div>

              {/* Grid variables */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-950 border border-stone-900/60 rounded-xl space-y-1">
                  <span className="font-mono text-[9px] text-stone-500 tracking-wider uppercase">Intimacy Level</span>
                  <div className="font-sans text-sm font-medium text-stone-200">{selectedPose.intimacyLevel}</div>
                </div>

                <div className="p-4 bg-stone-950 border border-stone-900/60 rounded-xl space-y-1">
                  <span className="font-mono text-[9px] text-stone-500 tracking-wider uppercase">Difficulty Grade</span>
                  <div className="font-sans text-sm font-medium text-stone-200">{selectedPose.difficulty}</div>
                </div>

                <div className="p-4 bg-stone-950 border border-stone-900/60 rounded-xl space-y-1">
                  <span className="font-mono text-[9px] text-stone-500 tracking-wider uppercase">Primary Mood</span>
                  <div className="font-sans text-sm font-medium text-stone-200">{selectedPose.primaryMood}</div>
                </div>

                <div className="p-4 bg-stone-950 border border-stone-900/60 rounded-xl space-y-1">
                  <span className="font-mono text-[9px] text-stone-500 tracking-wider uppercase">Sub-Somatic Focus</span>
                  <div className="font-sans text-sm font-medium text-stone-200">{selectedPose.focusArea}</div>
                </div>
              </div>

              {/* EXPERIENCE BREATHING SYNC SYSTEM */}
              <div className="p-6 bg-[#141312] border border-stone-850 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-sans text-sm font-medium text-stone-200">Somatic Sync Tool</h3>
                    <p className="font-sans text-xs text-stone-500 font-light">Breathe in unison to synchronize autonomic stress loops.</p>
                  </div>
                  <button
                    onClick={() => setIsPlayingFlow(!isPlayingFlow)}
                    className={`p-3.5 rounded-full hover:scale-105 transition-all text-stone-950 ${accentClass}`}
                  >
                    {isPlayingFlow ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                </div>

                {isPlayingFlow ? (
                  <div className="flex flex-col items-center justify-center space-y-6 py-6 border-t border-stone-900/60">
                    {/* Breathing circle simulator */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      {/* Pulse circle back */}
                      <motion.div
                        animate={{
                          scale: flowCycle === 'Inhale' ? 1.4 : flowCycle === 'Exhale' ? 0.9 : 1.4,
                          opacity: flowCycle === 'Hold' ? 0.8 : 0.4
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute inset-0 bg-stone-800/20 rounded-full blur-xl"
                      />
                      
                      {/* Living circle frontier */}
                      <motion.div
                        animate={{
                          scale: flowCycle === 'Inhale' ? 1.25 : flowCycle === 'Exhale' ? 0.85 : 1.25,
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-full border border-stone-700 bg-stone-900/80 flex flex-col items-center justify-center z-10 shadow-2xl"
                      >
                        <span className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                          {flowCycle}
                        </span>
                        <span className="font-sans text-xs text-stone-300 font-light mt-1">
                          {Math.round(flowProgress / 20) + 1}s
                        </span>
                      </motion.div>

                      {/* Continuous rotation indicator */}
                      <svg className="absolute w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="rgba(40,40,40,0.3)"
                          strokeWidth="2"
                          fill="transparent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="rgb(180, 180, 180)"
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray="377"
                          strokeDashoffset={377 - (377 * flowProgress) / 100}
                          className="transition-all duration-100 ease-linear"
                        />
                      </svg>
                    </div>

                    <div className="text-center space-y-1">
                      <span className="font-mono text-xs text-stone-200">
                        {flowCycle === 'Inhale' && 'Slowly take deep breath through nose...'}
                        {flowCycle === 'Hold' && 'Hold the breath in, feeling chest contact...'}
                        {flowCycle === 'Exhale' && 'Slowly exhale through mouth, relaxing hands...'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-t border-stone-900/60 space-y-4">
                    <Activity className="mx-auto text-stone-600 animate-pulse" size={32} />
                    <p className="font-sans text-xs text-stone-500 max-w-xs mx-auto leading-normal">
                      Click the play button to start a guided 4-second paced inhalation/exhalation sequence to settle into the frame.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
