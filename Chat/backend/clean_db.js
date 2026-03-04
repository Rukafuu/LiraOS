import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("[CLEAN_DB] Variável DATABASE_URL não encontrada, pulando...");
    return;
  }

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
  } catch (error) {
    console.error("[CLEAN_DB] Erro ao limpar o banco:", error);
  } finally {
    await client.end();
  }
}

run();
