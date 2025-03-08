export default () => ({
  PORT: parseInt(process.env.PORT, 10) || 5556,
  DATABASE_URL: process.env.DATABASE_URL!,
  NODE_ENV: process.env.NODE_ENV!,
  JWT_SECRET: process.env.JWT_SECRET!,
});
