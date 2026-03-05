import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bug, Lightbulb, X, Send, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getAuthHeaders } from '../services/userService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 🔴 Global error log capture
const MAX_LOGS = 50;
const errorLogs: string[] = [];

// Intercept console.error and console.warn
if (typeof window !== 'undefined') {
  const origError = console.error;
  const origWarn = console.warn;

  console.error = (...args: any[]) => {
    const line = `[ERROR] ${new Date().toISOString()} ${args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a).substring(0, 300) : String(a); }
      catch { return String(a); }
    }).join(' ')}`;
    errorLogs.push(line);
    if (errorLogs.length > MAX_LOGS) errorLogs.shift();
    origError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const line = `[WARN] ${new Date().toISOString()} ${args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a).substring(0, 300) : String(a); }
      catch { return String(a); }
    }).join(' ')}`;
    errorLogs.push(line);
    if (errorLogs.length > MAX_LOGS) errorLogs.shift();
    origWarn.apply(console, args);
  };

  // Catch unhandled errors
  window.addEventListener('error', (e) => {
    errorLogs.push(`[UNHANDLED] ${new Date().toISOString()} ${e.message} at ${e.filename}:${e.lineno}`);
    if (errorLogs.length > MAX_LOGS) errorLogs.shift();
  });

  window.addEventListener('unhandledrejection', (e) => {
    errorLogs.push(`[PROMISE] ${new Date().toISOString()} ${e.reason?.message || e.reason || 'Unknown'}`);
    if (errorLogs.length > MAX_LOGS) errorLogs.shift();
  });
}

export const getErrorLogs = () => [...errorLogs];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'general' | 'bug' | 'feature'>('general');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [capturedLogs, setCapturedLogs] = useState<string[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  // Capture logs when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedLogs(getErrorLogs());
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const context = {
        currentPath: window.location.pathname,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
        language: navigator.language,
        platform: navigator.platform,
      };

      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ 
          feedback, 
          type, 
          rating, 
          context,
          errorLogs: capturedLogs // Send captured error logs
        })
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setFeedback('');
          setType('general');
          setRating(null);
          setSubmitted(false);
          setShowLogs(false);
        }, 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to send feedback');
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900/95 backdrop-blur-lg z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Send Feedback
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-500/20 rounded-full">
              <Send className="text-green-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
            <p className="text-gray-400">Your feedback and logs have been sent to the developer.</p>
          </div>
        ) : (
          <>
            {/* Type Selection */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'bug' as const, icon: Bug, label: 'Bug Report', color: 'red' },
                  { value: 'feature' as const, icon: Lightbulb, label: 'Idea', color: 'purple' },
                  { value: 'general' as const, icon: MessageSquare, label: 'General', color: 'blue' }
                ].map(({ value, icon: Icon, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setType(value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      type === value
                        ? `bg-${color}-500/20 border-${color}-500 text-${color}-400`
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    style={type === value ? {
                      backgroundColor: color === 'red' ? 'rgba(239,68,68,0.2)' : color === 'purple' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)',
                      borderColor: color === 'red' ? '#ef4444' : color === 'purple' ? '#a855f7' : '#3b82f6',
                      color: color === 'red' ? '#fca5a5' : color === 'purple' ? '#c4b5fd' : '#93c5fd'
                    } : {}}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  How's your experience? (Optional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRating(num)}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        rating === num
                          ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500'
                          : 'bg-gray-800/50 text-gray-500 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {num === 1 ? '😕' : num === 2 ? '😐' : num === 3 ? '🙂' : num === 4 ? '😊' : '🤩'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Describe what happened</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you saw, what went wrong, or any ideas you have..."
                  className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                           text-white placeholder-gray-500 resize-none
                           focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              {/* Error Logs Section */}
              <div className="space-y-2">
                <button 
                  onClick={() => setShowLogs(!showLogs)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <AlertTriangle size={14} className="text-yellow-500" />
                  Error Logs ({capturedLogs.length} captured)
                  {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {showLogs && (
                  <div className="bg-black/40 border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto scrollbar-thin">
                    {capturedLogs.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No errors captured in this session ✨</p>
                    ) : (
                      <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap break-all">
                        {capturedLogs.join('\n')}
                      </pre>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-500">
                  These browser logs will be included automatically to help diagnose issues.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700 sticky bottom-0 bg-gray-900/95 backdrop-blur-lg">
              <button
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 
                         text-white font-semibold rounded-lg
                         hover:from-pink-600 hover:to-purple-700 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Feedback & Logs
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-pink-500 to-purple-600 
                 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 
                 transition-all duration-200"
        title="Send Feedback"
      >
        <MessageSquare size={24} />
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
