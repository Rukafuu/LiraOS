import React, { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, X, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'general' | 'bug' | 'feature' | 'ux'>('general');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const context = {
        currentPath: window.location.pathname,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      };

      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, type, rating, context })
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setFeedback('');
          setType('general');
          setRating(null);
          setSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
      alert('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback/export-logs`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liraos-logs-${Date.now()}.txt`;
      a.click();
    } catch (error) {
      alert('Failed to export logs');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
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
            <p className="text-gray-400">Your feedback helps make LiraOS better.</p>
          </div>
        ) : (
          <>
            {/* Type Selection */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'general', icon: MessageSquare, label: 'General' },
                  { value: 'bug', icon: Bug, label: 'Bug' },
                  { value: 'feature', icon: Lightbulb, label: 'Idea' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setType(value as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      type === value
                        ? 'bg-pink-500/20 border-pink-500 text-pink-500'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{label}</span>
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
                <label className="text-sm font-medium text-gray-300">Your feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think, or describe the issue..."
                  className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg 
                           text-white placeholder-gray-500 resize-none
                           focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={handleExportLogs}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white 
                         border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Export Logs
              </button>
              <button
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 
                         text-white font-semibold rounded-lg
                         hover:from-pink-600 hover:to-purple-700 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
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
