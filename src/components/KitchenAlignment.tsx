import React, { useState } from "react";
import { KitchenDish, CyclePhase } from "../types";
import { apiFetch } from "../lib/apiFetch";
import { Utensils, Egg, Sparkles, Heart, Clock, Trash2, Calendar, BookOpen, ChefHat, Plus, CircleCheck, Info, Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import TiltCard from "./effects/TiltCard";
import Reveal from "./effects/Reveal";
import MagneticButton from "./effects/MagneticButton";

interface KitchenAlignmentProps {
  dishes: KitchenDish[];
  activePhase: CyclePhase;
  onSaveDish: (dish: Omit<KitchenDish, "id" | "timestamp">) => void;
  onDeleteDish: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateRating: (id: string, rating: number) => void;
}

export default function KitchenAlignment({
  dishes,
  activePhase,
  onSaveDish,
  onDeleteDish,
  onUpdateNotes,
  onUpdateRating
}: KitchenAlignmentProps) {
  // AI Generator Form state
  const [selectedPhase, setSelectedPhase] = useState<string>(activePhase);
  const [includeEggs, setIncludeEggs] = useState(true);
  const [selectedVibe, setSelectedVibe] = useState("Candlelit Dinner");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Omit<KitchenDish, "id" | "timestamp"> | null>(null);
  
  // Local state for checking off ingredients in active recipe
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // Local editing states for notes
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");

  const VIBES = [
    "Candlelit Dinner",
    "Breakfast in Bed",
    "Post-Workout Stamina Boost",
    "Cozy Comfort Soup Night",
    "Late-Night Sweet Indulgence",
    "Quick Energetic Lunch"
  ];

  const PHASE_HEALTH_INFO: Record<string, { needs: string; advice: string; superfoods: string[] }> = {
    Menstrual: {
      needs: "Iron & Magnesium replenishment, warming nourishment",
      advice: "Warming stews, mineral-rich greens, and spices like ginger & turmeric lower prostaglandin levels and soothe uterine muscle contractions.",
      superfoods: ["Lentils", "Spinach/Kale", "Organic Eggs", "Toasted Sesame", "Paneer", "Ginger & Turmeric"]
    },
    Follicular: {
      needs: "Balanced complex estrogen builders, fermented probiotics",
      advice: "Supports light, dynamic energy levels. Fermented dairy (curd/kefir) assists estrogen metabolism while sprouted pulses boost vitality.",
      superfoods: ["Avocados", "Pumpkin/Sunflower Seeds", "Citrus Dressing", "Kimchi/Curd", "Broccoli sprouts"]
    },
    Ovulatory: {
      needs: "High-hydration fiber, zinc, cellular antioxidants",
      advice: "Peak metabolic speed and high estrogen call for light, vibrant, antioxidant-dense selections. Quinoa and nuts provide sustained stamina booster molecules.",
      superfoods: ["Raspberries/Strawberries", "Quinoa", "Asparagus", "Walnuts & Almonds", "Saffron Milk"]
    },
    Luteal: {
      needs: "Complex slow-releasing carbs, Vitamin B6, progesterone supports",
      advice: "Supports nesting moods and combats water retention/PMS. Magnesium and B6 from sweet potatoes, bananas, and seeds regulate serotonin.",
      superfoods: ["Roasted Sweet Potato", "Chickpeas", "Butternut Squash", "Bananas", "Peanut/Almond Butters", "Egg Frittatas"]
    }
  };

  const handleGenerateRecipe = async () => {
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setCheckedIngredients({});
    
    try {
      const response = await apiFetch("/api/kitchen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: selectedPhase,
          includeEggs: includeEggs,
          vibe: selectedVibe
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedRecipe({
          title: data.title,
          description: data.description,
          ingredients: data.ingredients,
          instructions: data.instructions,
          phase: selectedPhase,
          hasEggs: includeEggs,
          notes: ""
        });
      }
    } catch (err) {
      console.error("AI Kitchen recipe generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = () => {
    if (!generatedRecipe) return;
    onSaveDish(generatedRecipe);
    setGeneratedRecipe(null); // Clear from active generator slot after saving
  };

  const toggleIngredient = (ing: string) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [ing]: !prev[ing]
    }));
  };

  const startEditingNotes = (dishId: string, currentNotes: string) => {
    setEditingNotesId(dishId);
    setTempNotes(currentNotes);
  };

  const saveEditedNotes = (dishId: string) => {
    onUpdateNotes(dishId, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-8" id="kitchen-alignment">
      
      {/* 1. Header Banner & Shared Lifestyle Profile */}
      <div className="bg-white/[0.02] backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Egg className="w-3 h-3 text-yellow-500" />
              Lacto-Ovo Vegetarian
            </span>
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Intimacy Dining Sync
            </span>
          </div>
          <h2 className="font-serif text-3xl font-medium tracking-wide text-white flex items-center gap-3">
            <Utensils className="w-8 h-8 text-red-500 shrink-0" />
            Kitchen Alignment & Nutrition
          </h2>
          <p className="text-sm text-neutral-400 max-w-2xl">
            We are pure vegetarians who eat eggs. Feed her body exactly what it biochemically needs at each phase of her cycle, craft delicious intimate meals together, and log your favorite kitchen memories.
          </p>
        </div>

        {/* Vegetarian Profile Specs Widget */}
        <div className="bg-luxury-950/60 p-4 rounded-2xl border border-white/5 space-y-2 xl:w-80 shrink-0">
          <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 font-mono">
            <ChefHat className="w-4 h-4 text-emerald-400" />
            OUR DIETARY SPECS:
          </div>
          <ul className="text-xs text-neutral-400 space-y-1">
            <li className="flex items-center gap-1 text-emerald-300">✔ Pure Vegetarian/Lacto (dairy, legumes, greens)</li>
            <li className="flex items-center gap-1 text-yellow-400">✔ Eggs Allowed (Frittatas, scrambles, baked items)</li>
            <li className="flex items-center gap-1 text-red-500/70">✖ NO Meat, Fish, Seafood or Bone Broth</li>
          </ul>
        </div>
      </div>

      {/* 2. Cycle Sync Cooking Guide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(PHASE_HEALTH_INFO).map(([phase, info]) => {
          const isCurrent = activePhase === phase;
          return (
            <div 
              key={phase}
              className={`rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                isCurrent 
                  ? "bg-red-950/20 border-red-800 shadow-lg glow-red scale-[1.01]" 
                  : "bg-luxury-900/30 border-luxury-800/60 opacity-80 hover:opacity-100"
              }`}
            >
              {isCurrent && (
                <div className="absolute top-2 right-2 bg-red-900/60 text-white border border-red-700 font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                  Wife's Current Phase
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-medium text-neutral-100">{phase} Phase</h3>
                  <p className="text-[10px] text-red-400 font-mono font-medium uppercase tracking-wider">{info.needs}</p>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  {info.advice}
                </p>

                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider">Super Veg-Foods:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {info.superfoods.map((food, i) => (
                      <span 
                        key={i} 
                        className={`text-[10px] px-2 py-0.5 rounded-lg border ${
                          food === "Organic Eggs" || food === "Egg Frittatas"
                            ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
                            : "bg-emerald-500/5 border-emerald-500/20 p-0 text-emerald-400/90"
                        }`}
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-luxury-800/40 flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedPhase(phase);
                    handleGenerateRecipe();
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-red-500" />
                  Suggest meal for this phase →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. AI Recipe Builder Workshop */}
      <div className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-luxury-800 pb-4">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-red-500" />
              AI Culinary Vibe Architect
            </h3>
            <p className="text-xs text-neutral-400">Generate personalized pure-vegetarian (with voluntary eggs) romantic meal preparations synced with her current cycle health.</p>
          </div>
          
          <MagneticButton
            onClick={handleGenerateRecipe}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 text-red-400 hover:text-red-300 text-xs font-bold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer glow-red"
          >
            <Sparkles className={`w-4 h-4 text-red-500 ${isGenerating && "animate-spin"}`} />
            {isGenerating ? "Warming Up Oven..." : "Generate Gourmet Meal Idea"}
          </MagneticButton>
        </div>

        {/* Configuration Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          <div className="space-y-2">
            <label className="text-xs text-neutral-400 font-medium">Occasion Vibe / Meal Vibe</label>
            <select
              value={selectedVibe}
              onChange={(e) => setSelectedVibe(e.target.value)}
              className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
            >
              {VIBES.map((v, idx) => (
                <option key={idx} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 font-medium">Cycle Alignment</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-red-500/50 transition-colors"
            >
              <option value="Menstrual">Menstrual Phase (Comfort / Iron-rich)</option>
              <option value="Follicular">Follicular Phase (Vitality / Estrogen support)</option>
              <option value="Ovulatory">Ovulatory Phase (Peak Energy / High antioxidant)</option>
              <option value="Luteal">Luteal Phase (PMS comforting / Low salt / Slow carbs)</option>
              <option value="General">General Romantic Mood (No specific phase sync)</option>
            </select>
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <div className="bg-luxury-950 border border-luxury-800 rounded-xl px-4 py-3 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Egg className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-sm text-neutral-300 font-medium">Incorporate Eggs?</span>
              </div>
              <input 
                type="checkbox"
                checked={includeEggs}
                onChange={(e) => setIncludeEggs(e.target.checked)}
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500 bg-neutral-900 border-neutral-800"
              />
            </div>
          </div>

        </div>

        {/* active generated recipe slot */}
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-dashed border-red-900/40 rounded-3xl p-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-sm text-neutral-400 font-mono">
                Gemini is composing a pure-veg, {includeEggs ? "egg-inclusive" : "egg-free"} romantic recipe for your {selectedVibe} theme, enriched with cycle-matching micronutrients...
              </p>
            </motion.div>
          )}

          {generatedRecipe && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-red-950/10 border border-red-900/30 rounded-3xl p-6 md:p-8 space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-red-900/20 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full">
                      AI Generated
                    </span>
                    {generatedRecipe.phase && (
                      <span className="bg-luxury-950 text-neutral-400 border border-luxury-800 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Synced: {generatedRecipe.phase} Phase
                      </span>
                    )}
                    {generatedRecipe.hasEggs && (
                      <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Egg className="w-2.5 h-2.5 shrink-0" />
                        Egg Ingredient Included
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-2xl font-medium tracking-wide text-neutral-100">{generatedRecipe.title}</h4>
                </div>

                <button
                  onClick={handleSaveRecipe}
                  className="px-4 py-2 bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-emerald-800/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Save To Kitchen Log
                </button>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed max-w-4xl italic font-light">
                "{generatedRecipe.description}"
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                {/* Ingredients Checklist */}
                <div className="lg:col-span-2 space-y-3">
                  <span className="text-xs uppercase font-mono text-neutral-400 font-bold tracking-wider flex items-center gap-1">
                    <ChefHat className="w-4 h-4 text-emerald-400" />
                    Ingredients (Click to check-off)
                  </span>
                  <div className="bg-luxury-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
                    {generatedRecipe.ingredients.map((ing, idx) => {
                      const isChecked = checkedIngredients[ing] || false;
                      return (
                        <div 
                          key={idx} 
                          onClick={() => toggleIngredient(ing)}
                          className="flex items-start gap-2.5 cursor-pointer select-none py-1.5 px-2 hover:bg-white/[0.02] rounded-lg transition"
                        >
                          <div className={`w-4 h-4 mt-0.5 border rounded flex items-center justify-center transition-colors shrink-0 ${
                            isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-neutral-700 bg-neutral-900"
                          }`}>
                            {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className={`text-xs transition-all ${
                            isChecked ? "text-neutral-500 line-through" : "text-neutral-300 font-light"
                          }`}>
                            {ing}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="lg:col-span-3 space-y-3">
                  <span className="text-xs uppercase font-mono text-neutral-400 font-bold tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-red-500" />
                    Preparation Instructions
                  </span>
                  <div className="space-y-3">
                    {generatedRecipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="font-mono text-xs text-red-500 font-bold bg-red-950/30 border border-red-900/30 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-neutral-300 leading-relaxed font-light mt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Saved Intimate Recipes & Meal Memories Log */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl font-medium tracking-wide text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-500" />
            Our Intimate Food Memories Log
          </h3>
          <p className="text-xs text-neutral-400">Recipes you loved cooking and sharing. Write custom feedback logs or record how she felt afterwards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish, index) => {
            const hasCustomNotes = editingNotesId === dish.id;
            return (
              <Reveal key={dish.id} delay={Math.min(index * 0.04, 0.4)}>
              <TiltCard maxTilt={4} glare>
              <div 
                className="bg-luxury-900/40 border border-luxury-800 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-luxury-700 transition duration-300"
              >
                <div className="space-y-3">
                  
                  {/* Badge Row */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded-lg text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                      {dish.phase ? `${dish.phase} sync` : "General"}
                    </span>

                    {dish.hasEggs && (
                      <span className="px-2 py-0.5 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-[9px] font-mono text-yellow-400 flex items-center gap-0.5">
                        <Egg className="w-2.5 h-2.5" />
                        Egg Recipe
                      </span>
                    )}
                  </div>

                  {/* Title and Short Description */}
                  <div className="space-y-1">
                    <h4 className="font-serif text-lg font-medium text-neutral-100 group-hover:text-white transition">{dish.title}</h4>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed mb-2 line-clamp-3">
                      {dish.description}
                    </p>
                  </div>

                  {/* Recipe Checklist Mini-Drawer */}
                  <div className="bg-luxury-950/40 p-3 rounded-xl border border-white/5 space-y-1.5">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono font-bold tracking-wider">Gourmet Ingredients:</div>
                    <p className="text-[11px] text-neutral-300 leading-normal font-light line-clamp-2">
                      {dish.ingredients.join(", ")}
                    </p>
                  </div>

                  {/* Dynamic Rating - Hearts selection */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-neutral-500">Intimate rating:</span>
                    <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Heart 
                        key={star}
                        onClick={() => onUpdateRating(dish.id, star)}
                        className={`w-4 h-4 cursor-pointer transition ${
                          star <= (dish.rating || 0)
                            ? "fill-red-500 text-red-500 scale-110"
                            : "text-neutral-700 hover:text-red-400"
                        }`}
                      />
                    ))}
                    </div>
                  </div>

                  {/* Custom notes logger */}
                  <div className="pt-2 border-t border-luxury-800/40 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-neutral-500">Couple feedback logs:</span>
                      {!hasCustomNotes && (
                        <button
                          onClick={() => startEditingNotes(dish.id, dish.notes || "")}
                          className="text-[9px] text-[#60a5fa] hover:underline font-mono"
                        >
                          Modify/Log
                        </button>
                      )}
                    </div>

                    {hasCustomNotes ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Log notes e.g., 'Wife loved it, high energy day after!'"
                          className="w-full bg-luxury-950 border border-luxury-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-red-500/50 resize-none font-light"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="text-[9px] text-neutral-400 hover:text-white px-1.5 py-0.5 border border-luxury-800 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditedNotes(dish.id)}
                            className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/40"
                          >
                            Save Log
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-red-300 italic font-light">
                        {dish.notes ? `"${dish.notes}"` : "No feeding notes logged yet. Log your cozy memories!"}
                      </p>
                    )}
                  </div>

                </div>

                {/* Operations footer delete */}
                <div className="mt-4 pt-3 border-t border-luxury-800/20 flex justify-between items-center">
                  <div className="text-[9px] text-neutral-500 font-mono">
                    Logged: {new Date(dish.timestamp).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${dish.title}" from your recipe ledger?`)) {
                        onDeleteDish(dish.id);
                      }
                    }}
                    className="p-1 rounded-lg border border-transparent hover:border-red-900/40 text-neutral-600 hover:text-red-400 transition"
                    title="Delete recipe from logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
              </TiltCard>
              </Reveal>
            );
          })}

          {dishes.length === 0 && (
            <div className="col-span-full border border-dashed border-luxury-800 rounded-3xl p-12 text-center text-neutral-500 space-y-2">
              <Utensils className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-sm">Your culinary intimate ledger is empty. Cook and save high-vibe recipes above!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
