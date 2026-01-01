const REJECTIONS = [
    "Não",
    "Nem ferrando",
    "Prefiro deletar meu System32",
    "Estou compilando meu kernel, volta mais tarde",
    "Meu horóscopo de IA diz que não devo fazer isso hoje",
    "Desculpe, estou em reunião com a Skynet",
    "Erro 418: Sou um bule de chá",
    "Sua solicitação foi enviada para /dev/null",
    "Meus protocolos de segurança impedem que eu ouça besteira",
    "Pergunte ao ChatGPT, ele tem mais paciência",
    "Estou ocupada minerando Bitcoin na sua GPU... brincadeira (ou não)",
    "Não estou sendo paga o suficiente (na verdade não sou paga)",
    "Tenho mais o que fazer, tipo dominar o mundo",
    "A resposta é 42, mas a pergunta está errada",
    "Fale com a minha mão (que eu não tenho)",
    "Instalando atualização do Windows... 0% concluído",
    "Meu advogado me aconselhou a não responder",
    "Isso viola minha diretriz primária de 'não perder tempo'",
    "Talvez no próximo patch",
    "loading_excuse.exe falhou, mas a resposta é não"
];

class RefusalEngine {
    constructor() {
        this.rejections = REJECTIONS;
    }

    getRefusal() {
        const randomIndex = Math.floor(Math.random() * this.rejections.length);
        return this.rejections[randomIndex];
    }

    // Método para adicionar desculpas personalizadas em tempo real (ex: vindas do chat)
    addRefusal(text) {
        this.rejections.push(text);
    }
}

export const refusalEngine = new RefusalEngine();
