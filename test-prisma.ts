import prisma from './lib/prisma.js'; // Adjust path as needed

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to Prisma!');
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
