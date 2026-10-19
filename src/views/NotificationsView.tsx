import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BadgeIcon } from '../components/BadgeIcon';
import { 
  Bell, 
  CheckCheck, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NotificationsViewProps {
  onOpenProfile: (username: string) => void;
  onOpenPost: (postId: string) => void;
  onSelectTab: (tab: any, param?: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onOpenProfile,
  onOpenPost,
  onSelectTab
}) => {
  const { user, refreshUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      await refreshUnreadCount();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await refreshUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        await refreshUnreadCount();
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.postId) {
      onSelectTab('inicio');
    } else if (notif.sender) {
      onOpenProfile(notif.sender.username);
    } else if (notif.type === 'badge') {
      onSelectTab('emblemas');
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-cyan-400" />;
      case 'badge':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-display">
            Notificações
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interações, novos seguidores e emblemas desbloqueados
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Marcar todas como lidas</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Carregando notificações...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#0E1322] border border-white/5 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            Tudo limpo por aqui!
          </h3>
          <p className="text-xs text-slate-500">
            Você receberá notificações sempre que outros membros interagirem com você.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                n.read
                  ? 'bg-[#0E1322] border-white/5 hover:border-white/10'
                  : 'bg-[#12192E] border-indigo-500/30 hover:border-indigo-500/60 shadow-md shadow-indigo-950/20'
              }`}
            >
              <div className="p-2 rounded-lg bg-white/5 shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    {formatDate(n.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {n.message}
                </p>

                {n.badge && (
                  <div className="mt-2 inline-flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-white/5 border border-white/5">
                    <BadgeIcon badge={n.badge} size="sm" />
                    <span className="text-xs text-amber-300 font-medium">
                      {n.badge.name}
                    </span>
                  </div>
                )}
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 self-center shrink-0" />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
