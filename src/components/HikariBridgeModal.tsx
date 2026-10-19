import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BadgeIcon } from './BadgeIcon';
import { X, Layers, CheckCircle2, Code2, ExternalLink, ShieldCheck } from 'lucide-react';

interface HikariBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HikariBridgeModal: React.FC<HikariBridgeModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'schema' | 'architecture'>('preview');

  if (!isOpen) return null;

  const mockCommentUser = user || {
    id: 'usr_fern',
    displayName: 'Fern Zoltraak',
    username: 'fern_arcana',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    primaryBadge: {
      id: 'badge_estrela_guia',
      name: 'Estrela Guia de Frieren',
      description: 'Símbolo arcano da jornada mágica de um século.',
      rarity: 'epico' as const,
      category: 'sazonal' as const,
      icon: 'Wand2',
      glowColor: '#10B981',
      condition: 'Especialista em Frieren'
    }
  };

  const sampleJsonBridge = {
    hikariIntegrationVersion: "1.0.0",
    endpoint: `/api/integrations/hikari/profile/${mockCommentUser.username}`,
    memberId: mockCommentUser.id || "usr_sample",
    username: mockCommentUser.username,
    displayName: mockCommentUser.displayName,
    avatarUrl: mockCommentUser.avatarUrl,
    primaryBadge: mockCommentUser.primaryBadge,
    communityProfileUrl: `/perfil/${mockCommentUser.username}`,
    isVerifiedCommunityMember: true
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0E1322] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                Ponte de Integração Futura — Hikari ↔ Comunidade
              </h3>
              <p className="text-[11px] text-slate-400">
                Arquitetura desacoplada para compartilhamento de identidade pública
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 pt-3 border-b border-white/5 flex gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulação no Site Hikari
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Contrato da API Bridge
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Garantias e Regras
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <p className="text-slate-300">
                Esta simulação demonstra como os <strong>comentários de episódios no site Hikari</strong> passarão a renderizar a identidade do membro vinda da <strong>Comunidade Hikari</strong>, exibindo o avatar, @nick e o emblema principal equipado:
              </p>

              {/* Mock Episode Comment in Hikari Site style */}
              <div className="p-4 rounded-xl bg-[#090C15] border border-indigo-900/40 space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between pb-2 border-b border-white/5">
                  <span>HIKARI ANIME PLAYER · EPISÓDIO 28</span>
                  <span className="text-emerald-400 font-medium">Membro Verificado</span>
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={mockCommentUser.avatarUrl}
                    alt={mockCommentUser.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">
                        {mockCommentUser.displayName}
                      </span>
                      <span className="text-slate-400">
                        @{mockCommentUser.username}
                      </span>
                      {mockCommentUser.primaryBadge && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                          <BadgeIcon badge={mockCommentUser.primaryBadge} size="sm" />
                          <span className="text-[10px] text-purple-300">
                            {mockCommentUser.primaryBadge.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-200 text-xs">
                      "Que direção cinematográfica incrível nesse episódio final. Valeu cada segundo!"
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>Responder</span>
                      <span>Curtir (14)</span>
                      <span className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
                        Ver perfil na Comunidade <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/30 text-indigo-300">
                <strong>Preservação Integral:</strong> Os comentários existentes do Hikari (incluindo GIFs, respostas e curtidas) são totalmente mantidos. A Comunidade e os episódios operam com funções independentes.
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-300">
                <span>Endpoint de Consulta Pública:</span>
                <code className="text-indigo-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                  GET /api/integrations/hikari/profile/:username
                </code>
              </div>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] text-emerald-300 font-mono overflow-x-auto">
                {JSON.stringify(sampleJsonBridge, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Banco e Projeto Independentes:</strong> O projeto Comunidade Hikari possui sua própria camada de persistência, schemas e autenticação, sem conexões externas não autorizadas.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Imutabilidade de Identidade:</strong> Cada conta possui ID exclusivo e @nick validado no servidor, prevenindo falsificação de perfil.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Sem Impacto Retroativo:</strong> A integração futura será ativada via token federado ou API bridge sem apagar os comentários de episódios existentes do Hikari.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#090C15] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
