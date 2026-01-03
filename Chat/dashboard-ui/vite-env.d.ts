/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  // mais variáveis de ambiente aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
