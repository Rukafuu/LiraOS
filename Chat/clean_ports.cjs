const { exec } = require('child_process');

// Portas para limpar
const ports = [4000, 4001, 5002, 8000, 5000];

console.log('🔍 Procurando processos travados...');

ports.forEach(port => {
  // Comando para listar processos na porta
  exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
    if (stdout) {
      const lines = stdout.split('\n');
      lines.forEach(line => {
        // Parse da saída do netstat
        const parts = line.trim().split(/\s+/);
        // O PID é o último elemento
        const pid = parts[parts.length - 1];
        
        if (pid && /^\d+$/.test(pid) && pid !== '0') {
          console.log(`🔫 Matando PID ${pid} (Porta ${port})...`);
          exec(`taskkill /F /PID ${pid}`, (kErr) => {
             // Ignora erros (processo já morto, etc)
          });
        }
      });
    }
  });
});

console.log('✅ Comandos de limpeza enviados.');
console.log('⏳ Aguardando 3 segundos para liberação do sistema...');

setTimeout(() => {
    console.log('🏁 Pronto.');
}, 3000);
