import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Key, HelpCircle, ToggleLeft, ToggleRight, Trash, Eye, Download, Info } from 'lucide-react';
import { ScreenType, SecurityLog } from '../types';
import { SECURITY_LOGS } from '../data';

interface SecurityVaultViewProps {
  onNavigate: (screen: ScreenType) => void;
  accentClass: string;
}

export const SecurityVaultView: React.FC<SecurityVaultViewProps> = ({ onNavigate, accentClass }) => {
  const [logs, setLogs] = useState<SecurityLog[]>(SECURITY_LOGS);

  // Settings customizable states
  const [inactivityPurge, setInactivityPurge] = useState(true);
  const [duressSequence, setDuressSequence] = useState(false);
  const [deviceWipe, setDeviceWipe] = useState(true);

  // Custom log injection
  const addLog = (logText: string, logStatus: 'Routine' | 'Authorized' | 'Warning' | 'Success') => {
    const time = new Date().toTimeString().split(' ')[0] + ' UTC';
    setLogs((prev) => [{ timestamp: time, event: logText, status: logStatus }, ...prev]);
  };

  const handleToggleState = (
    type: 'purge' | 'duress' | 'wipe',
    currentState: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    label: string
  ) => {
    setter(!currentState);
    addLog(
      `Protocol modified: ${label} is now ${!currentState ? 'ENABLED' : 'DISABLED'}.`,
      'Warning'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-12 max-w-5xl mx-auto"
    >
      {/* Title */}
      <div className="max-w-4xl space-y-4">
        <div className="flex items-center space-x-2 text-emerald-500 font-mono text-[10px] tracking-widest uppercase">
          <ShieldCheck size={14} />
          <span>Active Vault Protected</span>
        </div>
        <h1 className="font-display text-4xl text-stone-100 font-extralight tracking-tight">
          Security & Encryption
        </h1>
        <p className="font-sans text-stone-400 text-sm font-light max-w-xl leading-relaxed">
          Manage your exclusive rsa-4096 / aes-256 keys, audit connection finger-prints, and fine-tune localized emergency purge safety valves.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Keys Exchange Platform */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Key Exchange card */}
          <div className="p-6 bg-[#141312] border border-stone-850 rounded-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-900">
              <div className="space-y-0.5">
                <h3 className="font-sans text-sm font-medium text-stone-200">Session Keys Verification</h3>
                <p className="font-sans text-xs text-stone-500 font-light">Double asymmetric handshakes current state.</p>
              </div>
              <span className="font-mono text-[9px] text-[#33a060] bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/40">Verified Active</span>
            </div>

            {/* Partner A */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-950 border border-stone-900 rounded-xl">
              <div className="flex items-center space-x-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDmQpmPu-Vuz3HKkcTnGLZSUNGsmaBsyLRSPYkzrb46eYfMILCG-b0MZoUkEADneyhemGevkS2AuF4YSp9i5S1y2Ngeftwp6yTbZXfbcaGhmky_0C7z3h09boG0wunuVfD1J_kISt3xeixcjxUJTbcev846RaiId_IuFcoumd8UHX65_AstdVxdUyxMkxxgHLWzuEw3IEiYWiqY6E7mRB_RLMafdasN8B4w6UvcM6BE2Bq9hrxqfCTEYVkdm6x2dRSdXs4hDrTd8AS"
                  alt="Julian"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border border-stone-800 object-cover"
                />
                <div>
                  <h4 className="font-sans text-xs font-semibold text-stone-200">Partner A: Julian</h4>
                  <p className="font-mono text-[9px] text-stone-500 tracking-tight select-all">
                    8F:3A:C4:B1:0D:E2:77:99:A1:B5:C4:D3:E2:F1:00:11:22:33:44:55
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-stone-500">Verified iOS Client</span>
            </div>

            {/* Partner B */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-stone-950 border border-stone-900 rounded-xl">
              <div className="flex items-center space-x-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwlIculrmYNWaPKrfubbRjSF02czgSi3PBBUdT6VRGfQzjuFC0jC0_miGFmMn1r1pQkxluqI1_732JdVP3d263cXMrB7UweJy4ZRnpJnup8zXrviFzwB9hJ0jOuIR8ySNThx13j_EmB4oZ-bbkLcPhQHWtw8Jl-YfDzLidj7EqScMhtkml-rdRaXcDhvQOu9F4uADVr5swVDJyPXYDsWQfxFqdimptGC243v4RD1h2Plw8aLzOQbFE-PFu-eYCQpfBjMDVJ47IxNQx"
                  alt="Elena"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border border-stone-800 object-cover"
                />
                <div>
                  <h4 className="font-sans text-xs font-semibold text-stone-200">Partner B: Elena</h4>
                  <p className="font-mono text-[9px] text-stone-500 tracking-tight select-all">
                    A4:77:C2:E1:99:B4:D3:F2:01:A2:B3:C4:D5:E6:F7:88:99:00:11:22
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-stone-500">Verified macOS Client</span>
            </div>
          </div>

          {/* Secure ephemeral instructions */}
          <div className="p-6 bg-stone-950 border border-stone-900 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-stone-900 text-[#a855f7] rounded-lg shrink-0">
              <Key size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="font-sans text-stone-200 text-xs font-semibold">Zero-Knowledge Architecture</h4>
              <p className="font-sans text-stone-500 text-[11px] font-light leading-relaxed">
                This sanctuary utilizes your hardware chip keys to authenticate connections. All content data is unrolled locally. No plain text data is saved to external hosting servers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Emergency purge panel */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="font-sans text-xs font-mono text-stone-500 tracking-widest uppercase">Emergency Protocol Valving</h3>
          
          <div className="space-y-4">
            
            {/* Protocol 1: Inactivity trigger */}
            <div className="p-5 bg-stone-950 border border-stone-900 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-xs font-semibold text-stone-200">Inactivity Master Purge</h4>
                  <p className="font-sans text-[11px] text-stone-500 font-light mt-0.5 leading-normal">
                    Wipe local cache if 72 hours pass without checking-in.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleState('purge', inactivityPurge, setInactivityPurge, 'Inactivity Master Purge')}
                  className="text-stone-400 hover:text-stone-200 transition-colors shrink-0"
                >
                  {inactivityPurge ? <ToggleRight size={38} className="text-[#a855f7]" /> : <ToggleLeft size={38} />}
                </button>
              </div>
            </div>

            {/* Protocol 2: Duress sequence */}
            <div className="p-5 bg-stone-950 border border-stone-900 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-xs font-semibold text-stone-200">Duress Code Sentinel</h4>
                  <p className="font-sans text-[11px] text-stone-500 font-light mt-0.5 leading-normal">
                    Inputting a secret second pass code renders the UI safely mock-empty.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleState('duress', duressSequence, setDuressSequence, 'Duress Sentinel')}
                  className="text-stone-400 hover:text-stone-200 transition-colors shrink-0"
                >
                  {duressSequence ? <ToggleRight size={38} className="text-[#a855f7]" /> : <ToggleLeft size={38} />}
                </button>
              </div>
            </div>

            {/* Protocol 3: Device wipe */}
            <div className="p-5 bg-stone-950 border border-stone-900 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans text-xs font-semibold text-stone-200">Decoy Remote Wipe</h4>
                  <p className="font-sans text-[11px] text-stone-500 font-light mt-0.5 leading-normal">
                    Allow either partner to issue total vault clear requests remotely.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleState('wipe', deviceWipe, setDeviceWipe, 'Remote Decoy Purge')}
                  className="text-stone-400 hover:text-stone-200 transition-colors shrink-0"
                >
                  {deviceWipe ? <ToggleRight size={38} className="text-[#a855f7]" /> : <ToggleLeft size={38} />}
                </button>
              </div>
            </div>

          </div>

          {/* Secure logs auditing list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-stone-900">
              <h3 className="font-sans text-xs font-mono text-stone-500 tracking-wider">Secure Audit Logs</h3>
              <span className="font-mono text-[9px] text-stone-600">Audit interval: 2m</span>
            </div>

            <div className="bg-stone-950 border border-stone-900 rounded-xl divide-y divide-stone-900 font-mono text-[10px] text-stone-400 max-h-48 overflow-y-auto">
              {logs.map((log, lidx) => (
                <div key={lidx} className="p-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-stone-600">{log.timestamp}</span>
                    <p className="text-stone-300 font-sans text-xs">{log.event}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-wide shrink-0 ${
                    log.status === 'Success' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-950' : 
                    log.status === 'Warning' ? 'text-rose-400 bg-rose-950/20 border-rose-950' : 
                    'text-stone-400 bg-stone-900 border-stone-850'
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
