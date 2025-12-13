import React from 'react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { Plus, MessageCircle } from 'lucide-react';

export function Sidebar() {
  const { state, dispatch } = useChat();
  const { theme, toggleTheme } = useTheme();

  const handleNewConversation = () => {
    // TODO: Create new conversation via API
    const newConversation = {
      id: Date.now().toString(),
      title: 'Nova Conversa',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
  };

  const handleSelectConversation = (id: string) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: id });
  };

  return (
    <div className="w-72 bg-nagisa-bgSoft dark:bg-nagisaDark-bgSoft border-r border-nagisa-border dark:border-nagisaDark-border flex flex-col">
      {/* Logo Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-nagisa-border/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-nagisa-accent to-nagisa-accentSoft flex items-center justify-center shadow-md">
            <span className="text-sm font-semibold text-white">L</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-nagisa-text leading-tight">Lira</span>
            <span className="text-xs text-nagisa-textSoft">Sua IA acolhedora</span>
          </div>
        </div>

        {/* Theme Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className="ml-auto flex items-center gap-2 text-[11px] text-nagisa-textSoft dark:text-nagisaDark-textSoft"
        >
          <span>{theme === "light" ? "Modo claro" : "Modo escuro"}</span>
          <span
            className={`
              relative inline-flex h-5 w-9 items-center rounded-full
              transition-colors duration-200
              ${theme === "light" ? "bg-nagisa-accentSoft" : "bg-nagisaDark-border"}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200
                ${theme === "light" ? "translate-x-0.5" : "translate-x-4"}
              `}
            />
          </span>
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="p-4 border-b border-nagisa-border">
        <button
          onClick={handleNewConversation}
          className="w-full flex items-center gap-3 px-4 py-3 bg-nagisa-accent text-white rounded-3xl hover:bg-nagisa-accent/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out shadow-sm shadow-nagisa-accentSoft"
        >
          <Plus size={20} />
          <span className="font-medium">Nova Conversa</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {state.conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation.id)}
              className={`w-full text-left p-3 rounded-2xl transition-all duration-200 ease-out ${
                state.currentConversationId === conversation.id
                  ? 'bg-nagisa-panel border border-nagisa-border shadow-sm'
                  : 'hover:bg-nagisa-accentSoft/40 hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                <MessageCircle size={16} className="text-nagisa-textSoft mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-nagisa-text truncate">
                    {conversation.title}
                  </h3>
                  <p className="text-sm text-nagisa-textSoft mt-1">
                    {conversation.updatedAt.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-nagisa-border">
        <div className="text-center">
          <p className="text-sm text-nagisa-textSoft">
            Chat Lira v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
