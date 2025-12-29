// Interface padrão para qualquer "Olho" de jogo
export interface GameEye {
    gameName: string;
    isActive: boolean;
    start: () => void;
    stop: () => void;
    onEvent: (callback: (event: GameEvent) => void) => void;
}

export interface GameEvent {
    game: string;
    type: 'kill' | 'death' | 'chat' | 'achievement' | 'status' | 'visual';
    data: any;
    description: string; // Texto pronto para a IA ler
}
