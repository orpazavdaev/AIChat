export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  },
});
