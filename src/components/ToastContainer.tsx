import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, X, ChevronRight, Bell, Sparkles } from 'lucide-react';

export interface ToastNotification {
  id: string;
  requestId?: string;
  type: 'approved' | 'rejected' | 'progress' | 'info';
  title: string;
  applicantName: string;
  reason: string;
  message: string;
  timestamp: string;
  stepInfo?: string;
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onNavigateToRequest?: (requestId?: string) => void;
}

export default function ToastContainer({ toasts, onDismiss, onNavigateToRequest }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-2 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          onNavigate={() => onNavigateToRequest && onNavigateToRequest(toast.requestId)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  key?: React.Key;
  toast: ToastNotification;
  onDismiss: () => void;
  onNavigate: () => void;
}

function ToastItem({
  toast,
  onDismiss,
  onNavigate
}: ToastItemProps) {
  // Auto dismiss after 6.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isApproved = toast.type === 'approved';
  const isRejected = toast.type === 'rejected';
  const isProgress = toast.type === 'progress';

  return (
    <div
      className={`pointer-events-auto w-full rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-slideIn ${
        isApproved
          ? 'bg-emerald-50/95 border-emerald-300/80 text-emerald-950 shadow-emerald-600/10'
          : isRejected
          ? 'bg-rose-50/95 border-rose-300/80 text-rose-950 shadow-rose-600/10'
          : 'bg-indigo-50/95 border-indigo-300/80 text-indigo-950 shadow-indigo-600/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Animated Icon Avatar */}
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-xs ${
            isApproved
              ? 'bg-emerald-500 text-white shadow-emerald-200'
              : isRejected
              ? 'bg-rose-500 text-white shadow-rose-200'
              : 'bg-indigo-600 text-white shadow-indigo-200'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
          ) : isRejected ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5 animate-spin-slow" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                isApproved
                  ? 'bg-emerald-200/70 text-emerald-800'
                  : isRejected
                  ? 'bg-rose-200/70 text-rose-800'
                  : 'bg-indigo-200/70 text-indigo-800'
              }`}
            >
              {isApproved ? 'อนุมัติเรียบร้อย' : isRejected ? 'ไม่อนุมัติ / ปฏิเสธ' : 'ความคืบหน้าคำร้อง'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">{toast.timestamp}</span>
          </div>

          <h4 className="font-bold text-xs sm:text-sm mt-1 text-gray-900 leading-snug">
            {toast.title}
          </h4>

          <p className="text-xs text-gray-700 mt-0.5 font-medium leading-relaxed">
            {toast.message}
          </p>

          {/* Additional details tags */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="bg-white/80 border border-black/5 px-2 py-0.5 rounded-md font-semibold text-gray-700">
              👤 {toast.applicantName}
            </span>
            {toast.stepInfo && (
              <span className="bg-white/80 border border-black/5 px-2 py-0.5 rounded-md font-semibold text-gray-600">
                📌 {toast.stepInfo}
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
            <button
              onClick={onNavigate}
              className={`text-xs font-bold inline-flex items-center gap-1 hover:underline cursor-pointer ${
                isApproved
                  ? 'text-emerald-700 hover:text-emerald-900'
                  : isRejected
                  ? 'text-rose-700 hover:text-rose-900'
                  : 'text-indigo-700 hover:text-indigo-900'
              }`}
            >
              <span>เปิดดูรายละเอียดคำร้อง</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDismiss}
              className="text-[11px] text-gray-500 hover:text-gray-800 px-2 py-0.5 rounded-md hover:bg-black/5 transition cursor-pointer"
            >
              ปิด
            </button>
          </div>
        </div>

        {/* Close Button at top-right */}
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-black/5 transition cursor-pointer"
          title="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated disappearing countdown bar */}
      <div className="mt-3 w-full bg-black/5 h-1 rounded-full overflow-hidden">
        <div
          className={`h-full animate-toastProgress origin-left ${
            isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-indigo-600'
          }`}
        />
      </div>
    </div>
  );
}
