import React, { memo, useRef, useState, useCallback } from 'react';
import { Send, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { Attachment } from '../types';

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 2;

interface ChatInputProps {
  inputText: string;
  isLoading: boolean;
  onInputChange: (text: string) => void;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onSlashCommand?: (command: string, args: string) => void;
}

const ChatInput = memo<ChatInputProps>(({ 
  inputText, 
  isLoading, 
  onInputChange, 
  onSendMessage,
  onSlashCommand
}) => {
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      const remainingSlots = MAX_FILES - pendingAttachments.length;
      const filesToProcess = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        alert(`You can only upload a maximum of ${MAX_FILES} files.`);
      }

      const newAttachments: Attachment[] = [];

      for (const file of filesToProcess) {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          alert(`File ${file.name} exceeds the ${MAX_FILE_SIZE_MB}MB limit and was skipped.`);
          continue;
        }

        try {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Strip the data URL prefix (e.g., "data:image/png;base64,")
          const base64Content = base64Data.split(',')[1];
          
          newAttachments.push({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            mimeType: file.type,
            data: base64Content,
            name: file.name
          });
        } catch (err) {
          console.error("Error reading file", err);
        }
      }

      setPendingAttachments(prev => [...prev, ...newAttachments]);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [pendingAttachments.length]);

  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    if ((!inputText.trim() && pendingAttachments.length === 0) || isLoading) return;
    
    const trimmedInput = inputText.trim();
    
    // Check if it's a slash command
    if (trimmedInput.startsWith('/') && onSlashCommand) {
      const commandPart = trimmedInput.slice(1); // Remove the '/'
      const spaceIndex = commandPart.indexOf(' ');
      
      let command: string;
      let args: string;
      
      if (spaceIndex === -1) {
        // No arguments
        command = commandPart;
        args = '';
      } else {
        // Has arguments
        command = commandPart.slice(0, spaceIndex);
        args = commandPart.slice(spaceIndex + 1);
      }
      
      // Execute slash command
      onSlashCommand(command, args);
      onInputChange('');
      return;
    }
    
    // Normal message sending
    onSendMessage(inputText, pendingAttachments);
    onInputChange('');
    setPendingAttachments([]);
  }, [inputText, pendingAttachments, isLoading, onSendMessage, onInputChange, onSlashCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-rose-100 dark:border-rose-900/20 shrink-0">
      <div className="max-w-4xl mx-auto space-y-3">
        
        {/* Pending Attachments Preview */}
        {pendingAttachments.length > 0 && (
           <div className="flex gap-3 overflow-x-auto py-2">
              {pendingAttachments.map((att, idx) => (
                <div key={idx} className="relative group shrink-0">
                   <div className="h-16 w-16 rounded-lg border border-rose-200 dark:border-rose-900/40 overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      {att.type === 'image' ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="text-rose-400" size={24} />
                      )}
                   </div>
                   <button 
                     onClick={() => removeAttachment(idx)}
                     className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <X size={10} />
                   </button>
                </div>
              ))}
           </div>
        )}

        <div className="relative flex items-end gap-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-rose-200 dark:focus-within:ring-rose-900/50 focus-within:border-rose-300 dark:focus-within:border-rose-700 transition-all">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            onChange={handleFileSelect}
            accept="image/*,application/pdf,text/plain" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors mb-0.5"
            title="Attach files"
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message LiraOS..."
            className="flex-1 max-h-32 py-3 bg-transparent border-none focus:ring-0 resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 scrollbar-hide"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          
          <button 
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && pendingAttachments.length === 0)}
            className={`
              p-3 rounded-full shadow-sm mb-0.5 transition-all duration-300
              ${isLoading || (!inputText.trim() && pendingAttachments.length === 0)
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md hover:scale-105 active:scale-95'
              }
            `}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">LiraOS may produce inaccurate information. Lira is based on Gemini 3 Pro Preview.</p>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
