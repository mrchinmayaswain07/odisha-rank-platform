"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  CheckCheck,
  MessageSquare,
  Award,
  BookOpen,
  Target,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  AppNotification,
  fetchStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notification-service";

interface NotificationBellProps {
  userId?: string;
  examId?: string;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userId = "demo-student-id",
  examId,
  className = "",
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "doubt" | "mock" | "material">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const list = await fetchStudentNotifications(userId, examId);
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Refresh notifications when window gets focus
    const onFocus = () => loadNotifications();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId, examId]);

  // Click outside listener to dismiss
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const categoryCounts = useMemo(() => {
    return {
      all: notifications.length,
      doubt: notifications.filter((n) => n.type === "doubt").length,
      mock: notifications.filter((n) => n.type === "mock").length,
      material: notifications.filter((n) => n.type === "material").length,
    };
  }, [notifications]);

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markNotificationAsRead(userId, notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }

    setIsOpen(false);

    if (notif.isDrive && notif.url) {
      window.open(notif.url, "_blank", "noopener,noreferrer");
    } else if (notif.actionRoute) {
      router.push(notif.actionRoute);
    }
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      markAllNotificationsAsRead(userId, unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "doubt":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "mock":
        return <Award className="w-4 h-4 text-blue-600" />;
      case "material":
        return <BookOpen className="w-4 h-4 text-sky-600" />;
      case "goal":
      default:
        return <Target className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getIconBg = (type: AppNotification["type"]) => {
    switch (type) {
      case "doubt":
        return "bg-purple-50 border-purple-200/80";
      case "mock":
        return "bg-blue-50 border-blue-200/80";
      case "material":
        return "bg-sky-50 border-sky-200/80";
      case "goal":
      default:
        return "bg-emerald-50 border-emerald-200/80";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden text-slate-800 animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-none">Notifications</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({categoryCounts.all})
            </button>
            <button
              onClick={() => setFilter("doubt")}
              className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                filter === "doubt"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Doubts {categoryCounts.doubt > 0 && `(${categoryCounts.doubt})`}
            </button>
            <button
              onClick={() => setFilter("mock")}
              className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                filter === "mock"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Mocks {categoryCounts.mock > 0 && `(${categoryCounts.mock})`}
            </button>
            <button
              onClick={() => setFilter("material")}
              className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
                filter === "material"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Materials {categoryCounts.material > 0 && `(${categoryCounts.material})`}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No Notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You have no updates in this category.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 sm:p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 relative ${
                    !notif.isRead ? "bg-blue-50/30" : "bg-white"
                  }`}
                >
                  {/* Category Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                      notif.type
                    )}`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {notif.title}
                      </span>
                      {notif.isDrive && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200/80">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          Drive
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[10px] font-medium text-slate-400">
                        {notif.timeAgo}
                      </span>

                      {notif.actionLabel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                          <span>{notif.actionLabel}</span>
                          {notif.isDrive ? (
                            <ExternalLink className="w-3 h-3" />
                          ) : (
                            <ArrowRight className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator dot */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 absolute right-3 top-4" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">OdishaRank Live Notification Feed</span>
            <button
              onClick={loadNotifications}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
