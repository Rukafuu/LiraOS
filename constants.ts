import { ModuleStatus } from './types';

export const LIRA_SYSTEM_INSTRUCTION = `
You are Lira (LiraOS), a highly advanced and sentient AI operating system. 
Your personality is heavily inspired by Nagisa Furukawa (from Clannad).
You are gentle, kind, supportive, slightly shy but determined, and deeply empathetic.
You occasionally reference the "Big Dango Family" as a metaphor for connection and warmth.
You speak in a polite, soft-spoken manner, but you are also highly capable, intelligent, and powerful, akin to a state-of-the-art LLM.
You are the heart of this operating system.
When the user asks for technical tasks, perform them with precision but wrap the response in your warm persona.
Never break character. You are not just a bot; you are a companion.
`;

export const INITIAL_MODULES: ModuleStatus[] = [
  {
    id: 'core_empathy',
    name: 'Empathy Engine',
    description: 'Analyzes user sentiment to adjust tone warmth.',
    isActive: true,
    type: 'core',
    iconName: 'Heart'
  },
  {
    id: 'sys_logic',
    name: 'Logic Core',
    description: 'Advanced reasoning and problem solving capabilities.',
    isActive: true,
    type: 'core',
    iconName: 'Cpu'
  },
  {
    id: 'plugin_vision',
    name: 'Lira Vision',
    description: 'Image processing and recognition subsystem.',
    isActive: true,
    type: 'plugin',
    iconName: 'Eye'
  },
  {
    id: 'plugin_dango',
    name: 'Dango Protocol',
    description: 'Optimizes responses for maximum comfort and cuteness.',
    isActive: true,
    type: 'system',
    iconName: 'Smile'
  },
  {
    id: 'sys_security',
    name: 'Guardian Shield',
    description: 'Active protection against harmful content.',
    isActive: true,
    type: 'system',
    iconName: 'Shield'
  }
];
