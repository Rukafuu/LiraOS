import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("[CLEAN_DB] Variável DATABASE_URL não encontrada, pulando...");
    return;
  }

  let retries = 5;
  while (retries > 0) {
    try {
      await client.connect();
      console.log(
        "[CLEAN_DB] Conectado ao banco. Limpando órfãos do gamification...",
      );
      const res = await client.query(
        'DELETE FROM "gamification" WHERE "userId" NOT IN (SELECT id FROM "users");',
      );
      console.log(
        `[CLEAN_DB] Limpeza finalizada! Linhas removidas: ${res.rowCount}`,
      );
      break;
    } catch (error) {
      if (error.code === '57P03' || error.message.includes('starting up')) {
        console.log(`[CLEAN_DB] Banco ainda iniciando... Retentando em 5s (${retries} tentativas restantes)`);
        retries--;
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      console.error("[CLEAN_DB] Erro ao limpar o banco:", error);
      break;
    } finally {
      if (retries === 0 || !client._connecting) {
         // Only end if we are done or gave up
      }
    }
  }
  await client.end().catch(() => {});
}

run();
