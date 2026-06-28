import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, Ticket, ShoppingBag } from "lucide-react";

import GiftsView from "../GiftsView";
import GiftsRealView from "../GiftsRealView";
import GiftPurchasesView from "../GiftPurchasesView";
import { SanctuaryDB } from "../../types";

export default function SurprisesDashboard({
  db,
  onClaim,
  onRedeem,
  onAddGift,
  onDeleteCustom,
  onGiveRealGift,
  onReceiveRealGift,
  onAddRealGift,
  onDeleteRealGift,
  onAddPurchase,
  onDeletePurchase,
}: {
  db: SanctuaryDB;
  onClaim: (id: string, by: "Him" | "Her") => void;
  onRedeem: (id: string) => void;
  onAddGift: any;
  onDeleteCustom: any;
  onGiveRealGift: any;
  onReceiveRealGift: any;
  onAddRealGift: any;
  onDeleteRealGift: any;
  onAddPurchase: any;
  onDeletePurchase: any;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"vouchers" | "gifts" | "wishlist">("vouchers");

  const subTabs = [
    { id: "vouchers", label: "Sensory Vouchers", icon: <Ticket className="w-4 h-4" /> },
    { id: "gifts", label: "Planned Gifts", icon: <Package className="w-4 h-4" /> },
    { id: "wishlist", label: "Wishlist", icon: <ShoppingBag className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-24">
      {/* Unified Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-3xl font-light text-white tracking-wide">Surprises & Gifting</h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Manage sensory coupons, plan real-world surprises, and track your wishlist.
        </p>
      </div>

      {/* Internal Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 cursor-pointer ${
                activeSubTab === tab.id
                  ? "text-amber-400"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeSubTab === tab.id && (
                <motion.div
                  layoutId="surprisesSubTabIndicator"
                  className="absolute inset-0 bg-amber-950/40 border border-amber-900/50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      <div className="w-full relative">
        <AnimatePresence mode="wait">
          {activeSubTab === "vouchers" && (
            <motion.div
              key="vouchers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GiftsView
                gifts={db.gifts}
                categories={db.adminSettings.voucherCategories || ["Pampering", "Sensual", "Intimate", "Wicked"]}
                onClaim={onClaim}
                onRedeem={onRedeem}
                onAddGift={onAddGift}
                onDeleteCustom={onDeleteCustom}
              />
            </motion.div>
          )}

          {activeSubTab === "gifts" && (
            <motion.div
              key="gifts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GiftsRealView
                gifts={db.realGifts || []}
                categories={db.adminSettings.giftCategories || ["Jewelry", "Experience", "Letter", "Trip", "Keepsake", "Other"]}
                onGive={onGiveRealGift}
                onReceive={onReceiveRealGift}
                onAddGift={onAddRealGift}
                onDeleteCustom={onDeleteRealGift}
              />
            </motion.div>
          )}

          {activeSubTab === "wishlist" && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GiftPurchasesView
                purchases={db.giftPurchases || []}
                onAddPurchase={onAddPurchase}
                onDeletePurchase={onDeletePurchase}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
