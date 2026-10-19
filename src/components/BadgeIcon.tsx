import React from 'react';
import { Badge, BadgeRarity } from '../types';
import { Sparkles, Wand2, Zap, Shield, Flame, Feather, ShieldCheck, Palette, Crown } from 'lucide-react';

interface BadgeIconProps {
  badge?: Badge;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  badge,
  size = 'md',
  showName = false,
  interactive = false,
  onClick
}) => {
  if (!badge) return null;

  const getLucideIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wand2': return <Wand2 className="w-full h-full" />;
      case 'Zap': return <Zap className="w-full h-full" />;
      case 'Shield': return <Shield className="w-full h-full" />;
      case 'Flame': return <Flame className="w-full h-full" />;
      case 'Feather': return <Feather className="w-full h-full" />;
      case 'ShieldCheck': return <ShieldCheck className="w-full h-full" />;
      case 'Palette': return <Palette className="w-full h-full" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-full h-full" />;
    }
  };

  const getRarityConfig = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'lendario':
        return {
          border: 'border-amber-400/80',
          bg: 'bg-gradient-to-br from-violet-900/90 via-purple-950/80 to-amber-950/40',
          text: 'text-amber-300',
          glow: 'shadow-[0_0_16px_rgba(251,191,36,0.35)]',
          label: 'Lendário',
          badgeClass: 'legendary-aura'
        };
      case 'epico':
        return {
          border: 'border-purple-500/70',
          bg: 'bg-gradient-to-br from-purple-900/80 to-indigo-950/70',
          text: 'text-purple-300',
          glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
          label: 'Épico',
          badgeClass: ''
        };
      case 'raro':
        return {
          border: 'border-cyan-500/60',
          bg: 'bg-gradient-to-br from-cyan-950/80 to-blue-950/70',
          text: 'text-cyan-300',
          glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]',
          label: 'Raro',
          badgeClass: ''
        };
      case 'comum':
      default:
        return {
          border: 'border-slate-600/50',
          bg: 'bg-slate-900/80',
          text: 'text-slate-300',
          glow: 'shadow-[0_0_6px_rgba(148,163,184,0.15)]',
          label: 'Comum',
          badgeClass: ''
        };
    }
  };

  const cfg = getRarityConfig(badge.rarity);

  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px] p-0.5',
    md: 'w-7 h-7 text-xs p-1.5',
    lg: 'w-10 h-10 text-sm p-2',
    xl: 'w-16 h-16 text-lg p-3'
  }[size];

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`inline-flex items-center gap-1.5 ${interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      title={`${badge.name} (${cfg.label}) — ${badge.description}`}
    >
      <div
        className={`relative rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.glow} ${cfg.badgeClass} ${sizeClasses} flex items-center justify-center shrink-0 overflow-hidden`}
        style={{
          boxShadow: badge.rarity === 'lendario' ? `0 0 14px ${badge.glowColor}55` : undefined
        }}
      >
        {badge.imageUrl ? (
          <img
            src={badge.imageUrl}
            alt={badge.name}
            className="w-full h-full object-cover rounded-md"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`${cfg.text} w-full h-full flex items-center justify-center`}>
            {getLucideIcon(badge.icon)}
          </div>
        )}

        {badge.rarity === 'lendario' && (
          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-300 rounded-full animate-ping opacity-60" />
        )}
      </div>

      {showName && (
        <span className={`text-xs font-medium tracking-tight ${cfg.text} truncate max-w-[120px]`}>
          {badge.name}
        </span>
      )}
    </div>
  );
};
