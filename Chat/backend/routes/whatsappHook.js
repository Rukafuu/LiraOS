import express from 'express';
import { shouldSummon } from '../modules/whatsapp/summonRules.js';
import { msgQueue } from '../modules/whatsapp/outboxQueue.js';
import { handleJoin } from '../modules/whatsapp/features/welcomeGoodbye.js';
import { getOrCreateWaUser } from '../modules/whatsapp/identity/waIdentity.js';
import { generateReply, enhancePrompt } from '../modules/whatsapp/chat/brainConnector.js';
import { createSticker } from '../modules/whatsapp/features/stickerMaker.js';
import { simpleStore } from '../modules/whatsapp/data/simpleStore.js';
import { groupStore } from '../modules/whatsapp/data/groupStore.js';
import { trackActivity } from '../modules/whatsapp/features/activityTracker.js';
import { generateProfileCard } from '../modules/whatsapp/features/profileCard.js';
import { handleDaily } from '../modules/whatsapp/features/dailyReward.js';
import { FunCommands } from '../modules/whatsapp/features/funCommands.js';
import { isGroupAdmin, performGroupAction } from '../modules/whatsapp/features/groupManager.js';
import { downloadVideo } from '../modules/whatsapp/features/videoDownloader.js';
import { generateImage } from '../modules/whatsapp/features/imageGenerator.js';
import { QuizGame } from '../modules/whatsapp/features/quizGame.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Load System Config
const configPath = path.resolve('config/whatsapp_mode.json');
let sysConfig = null;
try {
    if (fs.existsSync(configPath)) {
        sysConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) { console.error('Failed to load system config', e); }

const OWNER_ID = sysConfig?.experimental_config?.owner_number;
const PAYMENT = sysConfig?.payment_config;

router.post('/', async (req, res) => {
    try {
        const event = req.body;
        
        // Normalize IDs
        const senderNum = event.userId ? event.userId.split('@')[0].split(':')[0] : null;
        
        // Owner Check (Support Phone and LID)
        const PRIMARY_OWNER = OWNER_ID;
        const ADDITIONAL_OWNERS = ['38620983517314', '5511981826659']; // Explicit IDs
        const isOwner = (PRIMARY_OWNER && senderNum === PRIMARY_OWNER) || ADDITIONAL_OWNERS.includes(senderNum);
        
        console.log(`[Core] Event: ${event.type} from ${senderNum} (Owner: ${isOwner})`);

        if (event.type === 'message') {
            trackActivity(event);
            
            if (shouldSummon(event)) {
               console.log('[Debug] Summoned!');
               // Fix: Normalized event puts text in event.message.text
               const rawText = event.message.text || event.message.conversation || event.message.extendedTextMessage?.text || event.message.imageMessage?.caption || '';
               const text = rawText.trim();
               const cmd = text.toLowerCase();
               const isCommand = text.startsWith('/');
               
               console.log(`[Debug] Processing text: "${text.substring(0, 20)}..." (Cmd: ${isCommand})`);

               // --- OWNER COMMANDS ---
               if (cmd.startsWith('/addtime') && isOwner) {
                   const args = text.split(' ');
                   const days = parseInt(args[1]) || 30;
                   const targetGroup = event.groupId || 'dm';
                   
                   await groupStore.extendTrial(targetGroup, days);
                   msgQueue.add(event.groupId, { text: `✅ *Assinatura Renovada!*\n+${days} dias adicionados para este grupo.` });
                   return res.json({ status: 'ok' });
               }

               // /anunciar [texto] (Owner Broadcast)
               if ((cmd.startsWith('/anunciar') || cmd.startsWith('/broadcast')) && isOwner) {
                   const broadcastMsg = text.split(' ').slice(1).join(' ');
                   if (!broadcastMsg) {
                        msgQueue.add(event.groupId, { text: "⚠️ Digite a mensagem." });
                   } else {
                       const { groupStore: gs } = await import('../modules/whatsapp/data/groupStore.js');
                       const fs = await import('fs/promises'); // Dynamic import to be safe
                       const dbPath = path.resolve('config/whatsapp_groups.json');
                       
                       try {
                           const data = JSON.parse(await fs.readFile(dbPath, 'utf8'));
                           const groups = data.groups || {}; // Access 'groups' key if structure matches
                           const ids = Object.keys(data).filter(k => k.endsWith('@g.us')); // Direct keys or inside checks
                           
                           let count = 0;
                           msgQueue.add(event.groupId, { text: `📢 Iniciando transmissão para ${ids.length} grupos...` });
                           
                           for (const gid of ids) {
                               msgQueue.add(gid, { text: `📢 *Anúncio Oficial:*\n\n${broadcastMsg}` });
                               count++;
                               // No delay needed here, msgQueue handles it? Queue is fast locally. 
                               // Baileys queue handles rate limit? Maybe.
                           }
                           
                       } catch (e) {
                           msgQueue.add(event.groupId, { text: "Erro ao ler grupos." });
                       }
                   }
                   return res.json({ status: 'ok' });
               }

               // --- UTILITY COMMANDS (Payment / Support) ---
               if (cmd.startsWith('/pix') || cmd.startsWith('/pagar') || cmd.startsWith('/donate')) {
                   const msg = `💰 *Assinatura Lira Premium* 💰
                   
Mantenha a Lira no seu grupo e desbloqueie todos os recursos!
Valor: *R$ ${PAYMENT?.monthly_price || '19,90'} / mês*

🔑 *Chave PIX (Email):*
${PAYMENT?.pix_key || 'Configure no arquivo json'}

1. Copie a chave (Email) e faça o pagamento.
2. Envie o comprovante para o suporte.
3. Use */suporte* para falar com o admin.`;

                   msgQueue.add(event.groupId, { text: msg });
                   return res.json({ status: 'ok' });
               }

               if (cmd.startsWith('/suporte') || cmd.startsWith('/dono') || cmd.startsWith('/admin')) {
                    const vcard = 'BEGIN:VCARD\n' 
                        + 'VERSION:3.0\n' 
                        + `FN:${PAYMENT?.pix_name || 'Dono da Lira'}\n` 
                        + `TEL;type=CELL;waid=${OWNER_ID}:+${OWNER_ID}\n` 
                        + 'END:VCARD';
                    
                    msgQueue.add(event.groupId, { 
                        contacts: { 
                            displayName: PAYMENT?.pix_name || 'Admin', 
                            contacts: [{ vcard }] 
                        }
                    });
                    return res.json({ status: 'ok' });
               }

               // 1b. Identify User
               console.log('[Debug] Identifying User...');
               let waUser = await simpleStore.getUser(event.userId);
               if (!waUser) {
                   waUser = await simpleStore.createUser(event.userId, event.message.pushName);
               }
               console.log(`[Debug] User: ${waUser.name} (Reg: ${waUser.registered})`);

               // --- PROFILE GATE ---
               // Allow Reg, Help, and Payment commands to pass through
               if (isCommand && !isOwner) {
                   const allowedCommands = ['/reg', '/nome', '/name', '/help', '/ajuda', '/menu', '/ping', '/pix', '/pagar', '/suporte', '/dono', '/admin'];
                   const isAllowed = allowedCommands.some(c => cmd.startsWith(c));
                   
                   if (!isAllowed && waUser.registered !== true) {
                       msgQueue.add(event.groupId, { text: "🔒 *Identificação Necessária*\n\nPara usar a Lira, crie seu perfil de aventureiro!\n\n👉 Digite: */reg [Seu Nome]*\n_(Ex: /reg Matheus)_" });
                       return res.json({ status: 'blocked_registration' });
                   }
               }

               // --- TRIAL GATE ---
               console.log('[Debug] Checking Trial...');
               const gId = event.groupId || 'dm';
               const { group } = await groupStore.initGroup(gId);
               
               if (group && group.plan === 'trial' && group.expiration < Date.now()) {
                   if (isCommand && !isOwner) {
                       const allowedExpired = ['/status', '/pix', '/pagar', '/help', '/suporte', '/dono', '/admin'];
                       const isAllowed = allowedExpired.some(c => cmd.startsWith(c));
                       
                       if (!isAllowed) {
                           msgQueue.add(event.groupId, { text: "⚠️ *Período de Teste Expirado*\n\nEste grupo precisa renovar a assinatura da Lira.\nUse */status* para ver detalhes ou fale com o suporte." });
                           return res.json({ status: 'blocked_expired' });
                       }
                   }
               }

               // /status command
               if (cmd.startsWith('/status') || cmd.startsWith('/plano')) {
                   const timeLeft = Math.max(0, group.expiration - Date.now());
                   const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
                   const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (3600 * 1000));
                   
                   let statusMsg = `📊 *Status do Grupo*\n`;
                   statusMsg += `ID: ${group.id?.split('@')[0] || 'DM'}\n`;
                   
                   if (timeLeft > 0) {
                       statusMsg += `✅ *Ativo*\nExpira em: ${days}d ${hours}h`;
                   } else {
                       statusMsg += `❌ *Expirado*\nUse */pix* para renovar.`;
                   }
                   msgQueue.add(event.groupId, { text: statusMsg });
                   return res.json({ status: 'ok' });
               }

               // /sticker
               if (cmd.startsWith('/sticker') || cmd.startsWith('/s')) {
                   if (event.message.media && event.message.media.localPath) {
                       const stickerPath = await createSticker(event.message.media.localPath);
                       if (stickerPath) {
                            msgQueue.add(event.groupId, { sticker: { url: stickerPath } });
                       } else {
                           msgQueue.add(event.groupId, { text: "Falha ao criar sticker :(" });
                       }
                   } else {
                       msgQueue.add(event.groupId, { text: "Mande uma imagem com a legenda /sticker!" });
                   }
                   return res.json({ status: 'ok' });
               }

               // /rank
               if (cmd.startsWith('/rank') || cmd.startsWith('/top')) {
                   const topUsers = await simpleStore.getRank();
                   if (topUsers.length === 0) {
                        msgQueue.add(event.groupId, { text: "🏆 O Ranking está vazio." });
                   } else {
                       let msg = "🏆 *Ranking Global*\n\n";
                       topUsers.forEach((u, i) => {
                           msg += `${i+1}. ${u.name || 'Anônimo'} - ${u.xp} XP\n`;
                       });
                       msgQueue.add(event.groupId, { text: msg });
                   }
                   return res.json({ status: 'ok' });
               }

               // /reg
               if (cmd.startsWith('/nome') || cmd.startsWith('/name') || cmd.startsWith('/reg')) {
                   const newName = text.split(' ').slice(1).join(' ').trim();
                   if (newName.length < 2) {
                       msgQueue.add(event.groupId, { text: "⚠️ Use: /reg [Seu Nome] (Ex: /reg Matheus)" });
                   } else {
                       await simpleStore.setName(waUser.id, newName);
                       msgQueue.add(event.groupId, { text: `✅ Olá, ${newName}! Seu perfil foi criado/atualizado.` });
                   }
                   return res.json({ status: 'ok' });
               }

               // /daily
               if (cmd.startsWith('/daily') || cmd.startsWith('/diario') || cmd === '/d') {
                   const msg = await handleDaily(waUser.id, waUser.name);
                   msgQueue.add(event.groupId, { text: msg });
                   return res.json({ status: 'ok' });
               }

               // /menu
               if (cmd.startsWith('/menu') || cmd.startsWith('/help') || cmd.startsWith('/ajuda')) {
                   const menu = `🤖 *Menu da Lira* 🤖
                   
👤 *Geral*
*/perfil* - Seu cartão de jogador
*/rank* - Top 10 Global
*/daily* - Recompensa diária
*/reg [nome]* - Mudar nome

🎨 *Diversão*
*/sticker* - Fazer figurinha (legenda img)
*/ship @user* - Casal ou não?
*/dado* - Rolar D6
*/ppt [escolha]* - Pedra, Papel, Tesoura

🛠️ *Úteis*
*/dl [link]* - Baixar vídeos (Insta/TikTok/etc)
*/pix* - Assinatura Premium
*/suporte* - Contato do Dono

👮 *Admin*
*/kick @user* - Banir membro
*/mode [grok/normal]* - Mudar personalidade
*/promote @user* - Promover a admin
*/demote @user* - Rebaixar membro`;
                   msgQueue.add(event.groupId, { text: menu });
                   return res.json({ status: 'ok' });
               }

               // Fun Commands
               if (cmd.startsWith('/dado')) {
                   msgQueue.add(event.groupId, { text: FunCommands.rollDice() });
                   return res.json({ status: 'ok' });
               }
               if (cmd.startsWith('/ppt')) {
                   const choice = text.split(' ')[1]?.toLowerCase();
                   if (!choice) msgQueue.add(event.groupId, { text: "⚠️ Use: /ppt [pedra|papel|tesoura]" });
                   else msgQueue.add(event.groupId, { text: FunCommands.playRPS(choice) });
                   return res.json({ status: 'ok' });
               }
               if (cmd.startsWith('/ship')) {
                   const mentions = event.message.mentions || [];
                   let u1 = waUser.name;
                   let u2 = null;

                   // 1. Try Mentions
                   if (mentions.length > 0) {
                       u2 = `@${mentions[0].split('@')[0]}`;
                   }
                   
                   // 2. Try Text Arguments if no mention (or for second arg)
                   const args = text.split(/\s+/).slice(1);
                   if (!u2 && args.length > 0) {
                       u2 = args.join(' ');
                   }
                   
                   // 3. Dual Mode check
                   if (mentions.length >= 2) {
                        u1 = `@${mentions[0].split('@')[0]}`;
                        u2 = `@${mentions[1].split('@')[0]}`;
                   } else if (args.length >= 2 && mentions.length === 0) {
                        // "/ship Romeo Juliet" mode
                        u1 = args[0];
                        u2 = args.slice(1).join(' ');
                   }

                   // Default
                   if (!u2) u2 = "Alguém";
                   
                   msgQueue.add(event.groupId, { text: FunCommands.ship(u1, u2), mentions: mentions });
                   return res.json({ status: 'ok' });
               }

                // Admin Commands
               if (cmd.startsWith('/kick') || cmd.startsWith('/ban')) {
                   const mentions = event.message.mentions;
                   if (!mentions || !mentions.length) {
                        msgQueue.add(event.groupId, { text: "⚠️ Marque alguém com @ para remover." });
                   } else {
                       const isAdmin = await isGroupAdmin(event.groupId, event.userId);
                       if (!isAdmin && !isOwner) {
                           msgQueue.add(event.groupId, { text: "🚫 Apenas admins podem usar isso!" });
                       } else {
                           // Check if Bot is admin? (Gateway will fail if not)
                           const success = await performGroupAction(event.groupId, mentions, 'remove');
                           if (success) {
                               msgQueue.add(event.groupId, { text: "👋 Tchau!" });
                           } else {
                               msgQueue.add(event.groupId, { text: "❌ Falha ao remover. Eu sou admin do grupo?" });
                           }
                       }
                   }
                   return res.json({ status: 'ok' });
               }
               
               if (cmd.startsWith('/promote')) {
                   const mentions = event.message.mentions;
                   if (mentions && mentions.length && await isGroupAdmin(event.groupId, event.userId)) {
                       await performGroupAction(event.groupId, mentions, 'promote');
                       msgQueue.add(event.groupId, { text: "🫡 Promovido!" });
                   }
                   return res.json({ status: 'ok' });
               }
               
               if (cmd.startsWith('/demote')) {
                   const mentions = event.message.mentions;
                   if (mentions && mentions.length && await isGroupAdmin(event.groupId, event.userId)) {
                       await performGroupAction(event.groupId, mentions, 'demote');
                       msgQueue.add(event.groupId, { text: "📉 Rebaixado!" });
                   }
                   return res.json({ status: 'ok' });
               }


               // /dl (Download Video)
               if (cmd.startsWith('/dl') || cmd.startsWith('/baixar') || cmd.startsWith('/video')) {
                    const args = text.split(/\s+/);
                    const url = args[1]; // First arg after command
                    
                    if (!url || !url.startsWith('http')) {
                        msgQueue.add(event.groupId, { text: "⚠️ Cole o link do vídeo!\nEx: /dl https://instagram.com/..." });
                    } else {
                        // Feedback
                        msgQueue.add(event.groupId, { text: "⏳ Baixando vídeo... Aguarde." });
                        
                        // Async Process
                        downloadVideo(url).then(result => {
                            if (result && result.filePath) {
                                msgQueue.add(event.groupId, { 
                                    video: { url: result.filePath },
                                    caption: result.caption
                                });
                            } else {
                                const err = result?.error || "Desconhecido";
                                msgQueue.add(event.groupId, { text: `❌ Falha ao baixar.\nErro: ${err}` });
                            }
                        });
                    }
                    return res.json({ status: 'ok' });
               }

               // /profile
               if (cmd.startsWith('/profile') || cmd.startsWith('/perfil') || cmd.startsWith('/p')) {
                   const cardBuffer = await generateProfileCard(event.userId, waUser.name);
                   if (cardBuffer) {
                       const tempDir = path.resolve('temp');
                       if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                       const fileName = `profile_${event.userId.replace(/\D/g,'')}_${Date.now()}.png`;
                       const filePath = path.join(tempDir, fileName);
                       fs.writeFileSync(filePath, cardBuffer);
                       
                       let caption = `👤 Perfil de ${waUser.name}`;
                       msgQueue.add(event.groupId, { image: { url: filePath }, caption });
                   } else {
                       msgQueue.add(event.groupId, { text: "Erro ao gerar perfil." });
                   }
                   return res.json({ status: 'ok' });
               }



               // /img (Premium Image Generation)
               if (cmd.startsWith('/img') || cmd.startsWith('/imagine') || cmd.startsWith('/imaginar')) {
                   const prompt = text.split(' ').slice(1).join(' ');
                   
                   // 1. Premium Check
                   // Only allow if plan is NOT trial OR if owner
                   const isPremium = (group && group.plan !== 'trial') || isOwner;
                   
                   if (!isPremium) {
                       msgQueue.add(event.groupId, { text: "💎 *Recurso Premium*\nA criação de imagens é exclusiva para grupos assinantes.\nUse */pix* para assinar!" });
                       return res.json({ status: 'blocked_premium' });
                   }

                   if (!prompt) {
                       msgQueue.add(event.groupId, { text: "🎨 O que devo desenhar?\nEx: */img gato cibernético neon*" });
                   } else {
                       msgQueue.add(event.groupId, { text: `🎨 Criando "*${prompt}*"... (Aprimorando com Gemini ✨)` });
                       
                       const enhanced = await enhancePrompt(prompt);
                       const imgUrl = await generateImage(enhanced);
                       
                       if (imgUrl) {
                           msgQueue.add(event.groupId, { 
                               image: { url: imgUrl },
                               caption: `🎨 "${prompt}"\n✨: ${enhanced}\nCriado por Lira AI`
                           });
                       } else {
                           msgQueue.add(event.groupId, { text: "❌ Falha ao criar imagem." });
                       }
                   }
                   return res.json({ status: 'ok' });
               }


               // /quiz [tema]
               if (cmd.startsWith('/quiz')) {
                   const topic = text.split(' ').slice(1).join(' ') || 'conhecimentos gerais';
                   msgQueue.add(event.groupId, { text: `🧠 Preparando quiz sobre "${topic}"... (Gemini)` });
                   
                   const qMsg = await QuizGame.startQuiz(event.groupId, topic);
                   msgQueue.add(event.groupId, { text: qMsg });
                   return res.json({ status: 'ok' });
               }

               // /mode [grok|normal] (Admin Only)
               if (cmd.startsWith('/mode') || cmd.startsWith('/modo')) {
                   const args = text.split(' ');
                   let requestedMode = args[1]?.toLowerCase();
                   const validModes = ['grok', 'normal', 'lira'];
                   
                   // Get current mode
                   const { group } = await groupStore.initGroup(event.groupId); // Refresh group data
                   const currentMode = group.mode || 'normal';

                   // Logic: Toggle if no arg OR if requested matches current (and not normal)
                   if (!requestedMode) {
                        requestedMode = currentMode === 'grok' ? 'normal' : 'grok';
                   } else if (requestedMode === currentMode && currentMode !== 'normal') {
                        requestedMode = 'normal'; // Toggle off
                   }

                   if (!validModes.includes(requestedMode)) {
                       msgQueue.add(event.groupId, { text: "⚠️ Modos disponíveis: *normal* ou *grok*." });
                   } else {
                        const isAdmin = await isGroupAdmin(event.groupId, event.userId);
                        if (!isAdmin && !isOwner) {
                            msgQueue.add(event.groupId, { text: "🚫 Apenas admins podem mudar minha personalidade." });
                        } else {
                            const actualMode = requestedMode === 'lira' ? 'normal' : requestedMode;
                            await groupStore.updateGroup(event.groupId, { mode: actualMode });
                            
                            const msg = actualMode === 'grok' 
                                ? "😈 *Modo Grok Ativado!* Prepare-se para a verdade nua e crua." 
                                : "😇 *Modo Normal Ativado!* De volta a ser um amorzinho.";
                            
                            msgQueue.add(event.groupId, { text: msg });
                        }
                   }
                   return res.json({ status: 'ok' });
               }


               // --- QUIZ LISTENER ---
               const quizResult = QuizGame.checkAnswer(event.groupId, event.userId, text);
               if (quizResult) {
                   msgQueue.add(event.groupId, { text: quizResult });
                   return res.json({ status: 'ok' });
               }

               // Generate AI Reply
               if (!isCommand) {
                   console.log(`[WA] Generating reply for ${waUser.name}...`);
                   const groupMode = group?.mode || 'normal';
                   const replyText = await generateReply(waUser.id, text, [], groupMode);
                   msgQueue.add(event.groupId, { text: replyText });
                   await simpleStore.addXp(waUser.id, 10);
               }
            }
        } else if (event.type === 'join') {
            handleJoin(event, (to, msg) => msgQueue.add(to, msg));
        }

        res.json({ status: 'ok' });
    } catch (e) {
        console.error('Webhook Error:', e);
        try { fs.writeFileSync('error.log', e.stack || e.message); } catch {}
        res.status(500).json({ error: 'Internal Error' });
    }
});

export default router;
