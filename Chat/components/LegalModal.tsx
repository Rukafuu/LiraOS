
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Cookie, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: 'terms' | 'privacy' | 'cookies';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialSection = 'terms' }) => {
  const [activeSection, setActiveSection] = React.useState<'terms' | 'privacy' | 'cookies'>(initialSection);

  React.useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl h-[80vh] bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row ring-1 ring-white/5"
          onClick={e => e.stopPropagation()}
        >
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Legal Center
              </h2>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveSection('terms')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === 'terms' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">Termos de Uso</span>
              </button>

              <button
                onClick={() => setActiveSection('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === 'privacy' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Privacidade</span>
              </button>

              <button
                onClick={() => setActiveSection('cookies')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === 'cookies' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Cookie className="w-4 h-4" />
                <span className="font-medium">Cookies</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 relative flex flex-col bg-gradient-to-br from-[#0A0A0B] to-[#121214]">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <ScrollArea className="flex-1 p-8 md:p-10">
              <div className="max-w-2xl mx-auto prose prose-invert prose-purple">
                {activeSection === 'terms' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
                      <p className="text-zinc-400 text-sm">Última atualização: 23 de Dezembro de 2025</p>
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl mb-6">
                      <h4 className="flex items-center gap-2 text-purple-300 font-semibold mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Aviso Importante
                      </h4>
                      <p className="text-sm text-zinc-300 m-0">
                        A Lira é uma Inteligência Artificial experimental. Ao usar este serviço, você concorda que as respostas geradas podem conter imprecisões e não devem ser usadas como aconselhamento profissional (médico, jurídico ou financeiro).
                      </p>
                    </div>

                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">1. Aceitação dos Termos</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        Ao acessar e utilizar a LiraOS ("Serviço"), você concorda em cumprir estes Termos de Uso e todas as leis aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este Serviço.
                      </p>
                    </section>
                    
                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">2. Uso Aceitável</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        Você concorda em não usar o Serviço para:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-2 text-zinc-300">
                        <li>Gerar conteúdo ilegal, ofensivo, ameaçador ou prejudicial.</li>
                        <li>Violar direitos de propriedade intelectual de terceiros.</li>
                        <li>Tentar engenharia reversa, decompor ou hackear o sistema.</li>
                        <li>Usar para fins de spam ou automação não autorizada.</li>
                      </ul>
                      <p className="mt-3 text-zinc-400 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                        Violações graves resultarão no banimento imediato e permanente da conta, conforme nossa política de "Three Strikes".
                      </p>
                    </section>

                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">3. Propriedade Intelectual</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        O código-fonte, design, interface e marca LiraOS são propriedade exclusiva dos desenvolvedores. O conteúdo gerado pelas suas interações pertence a você, concedendo à Lira uma licença para processá-lo para fornecimento do serviço.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">4. Limitação de Responsabilidade</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        Em nenhum caso a LiraOS ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro) decorrentes do uso ou da incapacidade de usar o Serviço.
                      </p>
                    </section>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
                      <p className="text-zinc-400 text-sm">Sua segurança é nossa prioridade absoluta.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <strong className="text-white block mb-1">Dados Coletados</strong>
                        <p className="text-zinc-400 text-sm">Histórico de chat, preferências de usuário, e dados técnicos de acesso (IP, navegador).</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <strong className="text-white block mb-1">Armazenamento</strong>
                        <p className="text-zinc-400 text-sm">Banco de dados criptografado. Dados sensíveis (senhas) usam hashing forte.</p>
                      </div>
                    </div>

                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">1. Como usamos seus dados</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        Utilizamos suas informações exclusivamente para:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-2 text-zinc-300">
                        <li>Fornecer e manter o Serviço LiraOS.</li>
                        <li>Melhorar a personalização das respostas da IA (Memória Inteligente).</li>
                        <li>Monitorar o uso para fins de segurança e prevenção de abuso.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">2. Compartilhamento de Dados</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        NÃO vendemos seus dados pessoais. Compartilhamos dados apenas com:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-2 text-zinc-300">
                        <li>Provedores de IA (OpenAI/Anthropic/Google) estritamente para geração de resposta (sem retenção para treino, quando aplicável).</li>
                        <li>Autoridades legais, se obrigados por lei.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-white text-lg font-semibold mt-6 mb-3">3. Seus Direitos (LGPD/GDPR)</h3>
                      <p className="text-zinc-300 leading-relaxed">
                        Você tem o direito de solicitar:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-2 text-zinc-300">
                        <li>Cópia de todos os seus dados pessoais (Dump).</li>
                        <li>Exclusão permanente de sua conta e dados ("Direito ao Esquecimento").</li>
                        <li>Correção de dados incompletos ou inexatos.</li>
                      </ul>
                    </section>
                  </div>
                )}

                {activeSection === 'cookies' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">Política de Cookies</h1>
                      <p className="text-zinc-400 text-sm">Transparência total sobre rastreamento.</p>
                    </div>

                    <p className="text-zinc-300 leading-relaxed">
                      Utilizamos cookies e tecnologias similares para melhorar sua experiência. Você pode controlar suas preferências a qualquer momento nas configurações.
                    </p>

                    <div className="space-y-4 mt-6">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex gap-4">
                        <div className="p-2 bg-green-500/20 rounded-lg h-fit">
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Essenciais (Obrigatórios)</h4>
                          <p className="text-zinc-400 text-sm mt-1">
                            Necessários para o site funcionar (login, segurança, preferências de core). Não podem ser desativados.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex gap-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg h-fit">
                          <Zap className="w-5 h-5 text-blue-400" /> {/* Reusing Zap icon or similar */}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Funcionais</h4>
                          <p className="text-zinc-400 text-sm mt-1">
                            Lembram suas configurações de idioma, tema e personalização da interface.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex gap-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg h-fit">
                          <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Analíticos</h4>
                          <p className="text-zinc-400 text-sm mt-1">
                            Nos ajudam a entender como você usa a Lira para melhorarmos o produto. (Anônimo).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper component for Zap icon if not imported
function Zap({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}
