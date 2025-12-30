import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Trash2, CheckSquare, Square, Crown } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getAuthHeaders } from '../services/userService';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

interface TodoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userTier: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoList {
  id: string;
  title: string;
  items: TodoItem[];
  createdAt: number;
  updatedAt: number;
}

export const TodoPanel: React.FC<TodoPanelProps> = ({ isOpen, onClose, userTier }) => {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const hasAccess = ['Antares', 'Supernova', 'Singularity'].includes(userTier);

  useEffect(() => {
    if (isOpen && hasAccess) {
      loadLists();
    }
  }, [isOpen, hasAccess]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/todos`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLists(data);
        if (data.length > 0 && !selectedListId) {
          setSelectedListId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load todos:', e);
      addToast('Erro ao carregar tarefas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListTitle.trim()) return;
    
    const newList: TodoList = {
      id: `list_${Date.now()}`,
      title: newListTitle,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/todos`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newList)
      });

      if (res.ok) {
        setLists(prev => [newList, ...prev]);
        setSelectedListId(newList.id);
        setNewListTitle('');
        setIsCreatingList(false);
        addToast('Lista criada!', 'success');
      }
    } catch (e) {
      addToast('Erro ao criar lista', 'error');
    }
  };

  const addItem = async () => {
    if (!newItemText.trim() || !selectedListId) return;

    const newItem: TodoItem = {
      id: `item_${Date.now()}`,
      text: newItemText,
      completed: false,
      createdAt: Date.now()
    };

    const updatedLists = lists.map(list => {
      if (list.id === selectedListId) {
        return {
          ...list,
          items: [...list.items, newItem],
          updatedAt: Date.now()
        };
      }
      return list;
    });

    setLists(updatedLists);
    setNewItemText('');

    try {
      const updatedList = updatedLists.find(l => l.id === selectedListId);
      await fetch(`${API_BASE_URL}/api/todos/${selectedListId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      addToast('Erro ao salvar tarefa', 'error');
    }
  };

  const toggleItem = async (itemId: string) => {
    if (!selectedListId) return;

    const updatedLists = lists.map(list => {
      if (list.id === selectedListId) {
        return {
          ...list,
          items: list.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
          updatedAt: Date.now()
        };
      }
      return list;
    });

    setLists(updatedLists);

    try {
      const updatedList = updatedLists.find(l => l.id === selectedListId);
      await fetch(`${API_BASE_URL}/api/todos/${selectedListId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      addToast('Erro ao atualizar tarefa', 'error');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!selectedListId) return;

    const updatedLists = lists.map(list => {
      if (list.id === selectedListId) {
        return {
          ...list,
          items: list.items.filter(item => item.id !== itemId),
          updatedAt: Date.now()
        };
      }
      return list;
    });

    setLists(updatedLists);

    try {
      const updatedList = updatedLists.find(l => l.id === selectedListId);
      await fetch(`${API_BASE_URL}/api/todos/${selectedListId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      addToast('Erro ao deletar tarefa', 'error');
    }
  };

  const deleteList = async (listId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      setLists(prev => prev.filter(l => l.id !== listId));
      if (selectedListId === listId) {
        setSelectedListId(lists[0]?.id || null);
      }
      addToast('Lista deletada', 'info');
    } catch (e) {
      addToast('Erro ao deletar lista', 'error');
    }
  };

  const selectedList = lists.find(l => l.id === selectedListId);
  const completedCount = selectedList?.items.filter(i => i.completed).length || 0;
  const totalCount = selectedList?.items.length || 0;

  if (!isOpen) return null;

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 max-w-md text-center"
        >
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Recurso Premium</h2>
          <p className="text-gray-400 mb-6">
            O painel de To-Do está disponível apenas para usuários <span className="text-red-400 font-bold">Antares</span> ou superior.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-lira-pink text-white rounded-lg hover:bg-lira-pink/80 transition-colors"
          >
            Entendi
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden flex z-50"
      >
        {/* Sidebar - Lists */}
        <div className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="text-lira-pink" size={20} />
                Minhas Listas
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {isCreatingList ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createList()}
                  placeholder="Nome da lista..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lira-pink"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={createList}
                    className="flex-1 bg-lira-pink text-white text-xs py-1.5 rounded-lg hover:bg-lira-pink/80 transition-colors"
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingList(false);
                      setNewListTitle('');
                    }}
                    className="flex-1 bg-white/5 text-gray-400 text-xs py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingList(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg border border-white/5 transition-all"
              >
                <Plus size={16} />
                <span className="text-sm">Nova Lista</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {lists.map((list) => (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  selectedListId === list.id
                    ? 'bg-lira-pink/10 border border-lira-pink/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">{list.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteList(list.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {list.items.filter(i => i.completed).length}/{list.items.length} concluídas
                </div>
              </div>
            ))}

            {lists.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 text-sm">
                Nenhuma lista ainda.
                <br />
                Crie sua primeira!
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Tasks */}
        <div className="flex-1 flex flex-col">
          {selectedList ? (
            <>
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedList.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{totalCount} tarefas</span>
                  <span>•</span>
                  <span className="text-green-400">{completedCount} concluídas</span>
                  {totalCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{Math.round((completedCount / totalCount) * 100)}% completo</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="space-y-2 mb-6">
                  {selectedList.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-center gap-3 p-3 bg-[#18181b] border border-white/5 rounded-lg hover:border-white/10 transition-all"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="flex-shrink-0"
                      >
                        {item.completed ? (
                          <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-white/20 hover:border-white/40 transition-colors" />
                        )}
                      </button>

                      <span className={`flex-1 text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {item.text}
                      </span>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                    placeholder="Adicionar nova tarefa..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lira-pink"
                  />
                  <button
                    onClick={addItem}
                    disabled={!newItemText.trim()}
                    className="px-6 py-2.5 bg-lira-pink text-white rounded-lg hover:bg-lira-pink/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Selecione ou crie uma lista para começar</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
