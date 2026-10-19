import React, { useState } from 'react';
import { Badge } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BadgeIcon } from './BadgeIcon';
import { X, Check, Award, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

interface BadgeDetailModalProps {
  badge: Badge | null;
  isOpen: boolean;
  onClose: () => void;
  onBadgeEquipped?: (badgeId: string) => void;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  badge,
  isOpen,
  onClose,
  onBadgeEquipped
}) => {
  const { user, isAuthenticated, equipBadge, refreshUser, openAuthModal } = useAuth();
  const [isEquipping, setIsEquipping] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  if (!isOpen || !badge) return null;

  const isEquipped = user?.primaryBadgeId === badge.id;
  const isOwned = user?.badges?.some(b => b.badgeId === badge.id);

  const handleEquip = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setIsEquipping(true);
    try {
      await equipBadge(badge.id);
      onBadgeEquipped?.(badge.id);
      setMessage('Emblema equipado como principal com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setMessage(error.message || 'Erro ao equipar emblema.');
    } finally {
      setIsEquipping(false);
    }
  };

  const handleClaim = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setIsClaiming(true);
    try {
      await api.claimBadge(badge.id);
      await refreshUser();
      setMessage('Emblema conquistado com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setMessage(error.message || 'Requisitos não cumpridos.');
    } finally {
      setIsClaiming(false);
    }
  };

  const rarityLabel = {
    comum: 'Comum',
    raro: 'Raro',
    epico: 'Épico',
    lendario: 'Lendário'
  }[badge.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0E1322] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Badge Visual */}
        <div className="flex justify-center my-4">
          <div className="relative">
            <BadgeIcon badge={badge} size="xl" />
            {badge.rarity === 'lendario' && (
              <div className="absolute -inset-4 bg-amber-500/10 rounded-full blur-xl -z-10" />
            )}
          </div>
        </div>

        {/* Title & Rarity */}
        <h3 className="text-lg font-bold text-white font-display">
          {badge.name}
        </h3>

        <div className="flex items-center justify-center gap-2 text-xs mt-1 mb-3 text-slate-400">
          <span className="capitalize">{badge.category}</span>
          <span aria-hidden="true">·</span>
          <span className={`font-semibold ${
            badge.rarity === 'lendario' ? 'text-amber-300' :
            badge.rarity === 'epico' ? 'text-purple-300' :
            badge.rarity === 'raro' ? 'text-cyan-300' : 'text-slate-300'
          }`}>
            {rarityLabel}
          </span>
          {badge.season && (
            <>
              <span aria-hidden="true">·</span>
              <span>{badge.season}</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {badge.description}
        </p>

        {/* Condition Box */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-left mb-5">
          <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Condição de Obtenção</span>
          </div>
          <p className="text-xs text-slate-200">
            {badge.condition}
          </p>
        </div>

        {/* Notification feedback message */}
        {message && (
          <div className="mb-4 p-2 text-xs rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200">
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {isOwned ? (
            isEquipped ? (
              <div className="w-full py-2.5 px-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs font-semibold text-indigo-300 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Emblema Principal Ativo</span>
              </div>
            ) : (
              <button
                onClick={handleEquip}
                disabled={isEquipping}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2"
              >
                {isEquipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                <span>Equipar como Emblema Principal</span>
              </button>
            )
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">
                Você ainda não conquistou este emblema.
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>Simular Desbloqueio (Demonstração)</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
