import React, { useState } from 'react';
import { Badge, BadgeCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { BadgeIcon } from '../components/BadgeIcon';
import { BadgeDetailModal } from '../components/BadgeDetailModal';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Shield, 
  Flame, 
  Wand2, 
  Zap,
  Star
} from 'lucide-react';

interface BadgesViewProps {
  badges: Badge[];
}

export const BadgesView: React.FC<BadgesViewProps> = ({ badges }) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const ownedBadgeIds = new Set((user?.badges || []).map(b => b.badgeId));

  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(b => b.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'Todas as Coleções' },
    { id: 'lendaria', label: 'Lendárias & Supremas' },
    { id: 'sazonal', label: 'Sazonais' },
    { id: 'evento', label: 'Eventos' },
    { id: 'contribuicao', label: 'Contribuições' },
    { id: 'apoio', label: 'Apoio à Comunidade' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <Award className="w-4 h-4" />
          <span>GALERIA DE CONQUISTAS COLECIONÁVEIS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Emblemas & Brasões da Comunidade
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Um ecossistema puramente colecionável, sem sistemas de pontuações artificiais ou níveis arbitrários. Cada emblema representa marcos reais de participação, resenhas críticas e eventos sazonais.
        </p>

        {/* User stats summary */}
        {user && (
          <div className="inline-flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
            <span className="font-semibold text-white">Sua Coleção:</span>
            <span className="text-indigo-400 tabular-nums font-bold">
              {ownedBadgeIds.size} de {badges.length}
            </span>
            <span>desbloqueados</span>
          </div>
        )}
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBadges.map(badge => {
          const isOwned = ownedBadgeIds.has(badge.id);
          const isEquipped = user?.primaryBadgeId === badge.id;

          const rarityBorder = {
            lendario: 'border-amber-500/50 hover:border-amber-400',
            epico: 'border-purple-500/40 hover:border-purple-400',
            raro: 'border-cyan-500/30 hover:border-cyan-400',
            comum: 'border-white/5 hover:border-white/20'
          }[badge.rarity];

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-5 rounded-2xl bg-[#0E1322] border ${rarityBorder} shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between hover:scale-[1.02] relative overflow-hidden`}
            >
              {/* Equipped ribbon */}
              {isEquipped && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/40">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                  <span>Equipado</span>
                </div>
              )}

              {/* Top insignia */}
              <div className="flex items-center justify-between mb-3">
                <BadgeIcon badge={badge} size="lg" />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  badge.rarity === 'lendario' ? 'text-amber-300' :
                  badge.rarity === 'epico' ? 'text-purple-300' :
                  badge.rarity === 'raro' ? 'text-cyan-300' : 'text-slate-400'
                }`}>
                  {badge.rarity}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 mb-4">
                <h3 className="font-bold text-sm text-white font-display">
                  {badge.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Requirement Box */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {badge.condition}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="capitalize text-slate-400">{badge.category}</span>
                  <span className={`font-medium ${isOwned ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOwned ? '✓ Conquistado' : 'A desbloquear'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

    </div>
  );
};
