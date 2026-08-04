require('dotenv').config();

// Business Rule: Mandatory env vars — agar yo'q bo'lsa, server ISHGA TUSHMAYDI
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_GUEST_SECRET', 'ENCRYPTION_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ FATAL: ${envVar} environment variable is not set. Server cannot start.`);
    process.exit(1);
  }
}

const { server, io } = require('./app');
const prisma = require('./utils/prismaClient');
const startPendingPaymentCancelJob = require('./cronJobs');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start cron jobs
    startPendingPaymentCancelJob(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

