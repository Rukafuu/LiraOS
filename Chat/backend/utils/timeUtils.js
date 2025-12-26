
export function getTemporalContext(clientTime) {
  if (clientTime) {
      return `[CONTEXTO TEMPORAL]\n(Horário Local do Usuário)\n${clientTime}`;
  }

  const now = new Date();
  const timeZone = 'America/Sao_Paulo';
  
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long', timeZone });
  const dateDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone });
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone });

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `[CONTEXTO TEMPORAL]\nHoje é: ${capitalizedWeekday}, ${dateDate}.\nHora: ${time}.`;
}
