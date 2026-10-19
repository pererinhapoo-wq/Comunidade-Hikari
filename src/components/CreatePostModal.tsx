import React, { useState } from 'react';
import { api } from '../services/api';
import { Post, Anime, PostCategory } from '../types';
import { 
  X, 
  Image as ImageIcon, 
  Upload, 
  AlertTriangle, 
  BarChart2, 
  Plus, 
  Trash2, 
  Loader2,
  Sparkles
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  animes: Anime[];
  defaultCategory?: PostCategory;
  defaultAnimeId?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  animes,
  defaultCategory = 'geral',
  defaultAnimeId = ''
}) => {
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<PostCategory>(defaultCategory);
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(defaultAnimeId);
  const [episodeNumber, setEpisodeNumber] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [isSpoiler, setIsSpoiler] = useState<boolean>(false);
  const [spoilerWarning, setSpoilerWarning] = useState<string>('');
  
  // Images
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Poll
  const [hasPoll, setHasPoll] = useState<boolean>(false);
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setErrorMsg('Máximo de 5 imagens por publicação.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    try {
      const fileArray = Array.from(files).slice(0, 5 - images.length);
      const urls = await api.uploadImages(fileArray);
      setImages(prev => [...prev, ...urls]);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao enviar imagens.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPresetImage = (url: string) => {
    if (images.length >= 5) {
      setErrorMsg('Máximo de 5 imagens por publicação.');
      return;
    }
    setImages(prev => [...prev, url]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    setPollOptions(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      setErrorMsg('Insira um texto ou selecione pelo menos uma imagem.');
      return;
    }

    if (hasPoll && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) {
      setErrorMsg('Preencha a pergunta da enquete e pelo menos duas opções.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedAnime = animes.find(a => a.id === selectedAnimeId);
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const res = await api.createPost({
        content: content.trim(),
        images,
        category,
        animeId: selectedAnime?.id,
        animeTitle: selectedAnime?.title,
        episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : undefined,
        tags,
        isSpoiler,
        spoilerWarning: isSpoiler ? (spoilerWarning || 'Contém spoilers do enredo') : undefined,
        pollQuestion: hasPoll ? pollQuestion : undefined,
        pollOptions: hasPoll ? pollOptions.filter(o => o.trim()) : undefined
      });

      onPostCreated(res.post);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao publicar na comunidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0E1322] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-white">
              Nova Publicação
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Category tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Categoria
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'geral', label: 'Geral' },
                { id: 'episodio', label: 'Episódio' },
                { id: 'teoria', label: 'Teoria' },
                { id: 'debate', label: 'Debate' },
                { id: 'galeria', label: 'Galeria' },
                { id: 'recomendacao', label: 'Recomendação' },
                { id: 'enquete', label: 'Enquete' }
              ].map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id as PostCategory);
                    if (cat.id === 'enquete') setHasPoll(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anime & Episode selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Anime Vinculado (Opcional)
              </label>
              <select
                value={selectedAnimeId}
                onChange={e => setSelectedAnimeId(e.target.value)}
                className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Nenhum anime específico</option>
                {animes.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedAnimeId && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Número do Episódio
                </label>
                <input
                  type="number"
                  min="1"
                  max="1200"
                  value={episodeNumber}
                  onChange={e => setEpisodeNumber(e.target.value)}
                  placeholder="Ex: 28"
                  className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Conteúdo da Publicação
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Compartilhe suas teorias, opiniões sobre episódios ou curiosidades de anime..."
              className="w-full bg-[#141B2D] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Images Upload / Previews */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">
                Imagens ({images.length}/5)
              </label>
              <span className="text-[11px] text-slate-400">JPG, PNG, WEBP (máx. 5MB)</span>
            </div>

            {/* Selected images list */}
            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mb-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-white/10 group">
                    <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button & Quick Presets */}
            {images.length < 5 && (
              <div className="flex items-center gap-2 flex-wrap">
                <label className="cursor-pointer px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs text-slate-300 flex items-center gap-2 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-indigo-400" />
                  )}
                  <span>{isUploading ? 'Enviando...' : 'Carregar Imagem'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Preset quick anime wallpapers */}
                <span className="text-[11px] text-slate-400">ou use um visual:</span>
                <button
                  type="button"
                  onClick={() => handleAddPresetImage('/src/assets/images/hikari_hero_banner_1792424735133.jpg')}
                  className="px-2 py-1 rounded bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-300 hover:bg-indigo-900/50"
                >
                  + Noite Hikari
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetImage('/src/assets/images/anime_frieren_journey_1792424735166.jpg')}
                  className="px-2 py-1 rounded bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-300 hover:bg-indigo-900/50"
                >
                  + Frieren
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPresetImage('/src/assets/images/anime_jujutsu_sorcerer_1792424736668.jpg')}
                  className="px-2 py-1 rounded bg-indigo-950/40 border border-indigo-800/30 text-[11px] text-indigo-300 hover:bg-indigo-900/50"
                >
                  + Jujutsu
                </button>
              </div>
            )}
          </div>

          {/* Interactive Poll Section */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setHasPoll(!hasPoll)}
              className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              <span>{hasPoll ? 'Remover Enquete' : 'Adicionar Enquete Interativa'}</span>
            </button>

            {hasPoll && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Pergunta da Enquete
                  </label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="Ex: Qual luta teve a melhor animação até agora?"
                    className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-400">
                    Opções
                  </label>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handlePollOptionChange(i, e.target.value)}
                        placeholder={`Opção ${i + 1}`}
                        className="flex-1 bg-[#141B2D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(i)}
                          className="p-1.5 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar mais uma opção</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Spoiler Protection Toggle */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={e => setIsSpoiler(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
              />
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Marcar como Spoiler
              </span>
            </label>

            {isSpoiler && (
              <div>
                <input
                  type="text"
                  value={spoilerWarning}
                  onChange={e => setSpoilerWarning(e.target.value)}
                  placeholder="Aviso específico (ex: Spoilers do Episódio 28 / Mangá)"
                  className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="Ex: Frieren, Magia, Análise, Madhouse"
              className="w-full bg-[#141B2D] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-md shadow-indigo-600/30 transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publicar na Comunidade</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
