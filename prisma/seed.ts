import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.activity.deleteMany()
  await prisma.loanPayment.deleteMany()
  await prisma.loanVote.deleteMany()
  await prisma.loan.deleteMany()
  await prisma.saving.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      memberCode: 'KKB-ADMIN',
      username: 'admin',
      email: 'admin@kikoba.com',
      password: hashedPassword,
      phone: '+255700000001',
    },
  })

  // Create member users
  const member1 = await prisma.user.create({
    data: {
      memberCode: 'KKB-JOHN',
      username: 'john_doe',
      email: 'john@kikoba.com',
      password: hashedPassword,
      phone: '+255700000002',
    },
  })

  const member2 = await prisma.user.create({
    data: {
      memberCode: 'KKB-MARY',
      username: 'mary_alice',
      email: 'mary@kikoba.com',
      password: hashedPassword,
      phone: '+255700000003',
    },
  })

  const member3 = await prisma.user.create({
    data: {
      memberCode: 'KKB-PETER',
      username: 'peter_james',
      email: 'peter@kikoba.com',
      password: hashedPassword,
      phone: '+255700000004',
    },
  })

  // Create a group
  const group = await prisma.group.create({
    data: {
      name: 'Kikoba ya Maendeleo',
      description: 'Kikundi cha akiba na mikopo ya maendeleo',
      createdBy: admin.id,
      joinCode: 'KIKOBA2024',
    },
  })

  // Add members to group
  await prisma.groupMember.createMany({
    data: [
      { userId: admin.id, groupId: group.id, role: 'ADMIN' },
      { userId: member1.id, groupId: group.id, role: 'MEMBER' },
      { userId: member2.id, groupId: group.id, role: 'MEMBER' },
      { userId: member3.id, groupId: group.id, role: 'MEMBER' },
    ],
  })

  // Create savings
  const savings = [
    { userId: admin.id, groupId: group.id, amount: 50000, note: 'Mchango wa kwanza' },
    { userId: member1.id, groupId: group.id, amount: 30000, note: 'Akiba ya mwezi' },
    { userId: member2.id, groupId: group.id, amount: 45000, note: 'Akiba ya robo mwaka' },
    { userId: member3.id, groupId: group.id, amount: 25000, note: 'Mchango wa kawaida' },
    { userId: member1.id, groupId: group.id, amount: 20000, note: 'Akiba ya ziada' },
    { userId: admin.id, groupId: group.id, amount: 60000, note: 'Mchango mkubwa' },
  ]
  
  for (const saving of savings) {
    await prisma.saving.create({ data: saving })
  }

  // Create loans
  const loan1 = await prisma.loan.create({
    data: {
      userId: member1.id,
      groupId: group.id,
      amount: 100000,
      reason: 'Biashara ya mboga na matunda',
      duration: 3,
      interestRate: 10,
      status: 'APPROVED',
    },
  })

  const loan2 = await prisma.loan.create({
    data: {
      userId: member2.id,
      groupId: group.id,
      amount: 150000,
      reason: 'Mashamba ya kilimo',
      duration: 6,
      interestRate: 10,
      status: 'PENDING',
    },
  })

  const loan3 = await prisma.loan.create({
    data: {
      userId: member3.id,
      groupId: group.id,
      amount: 80000,
      reason: 'Elimu ya mtoto',
      duration: 4,
      interestRate: 10,
      status: 'PENDING',
    },
  })

  // Create votes for pending loans
  await prisma.loanVote.createMany({
    data: [
      { loanId: loan2.id, userId: admin.id, vote: 'APPROVE' },
      { loanId: loan2.id, userId: member1.id, vote: 'APPROVE' },
      { loanId: loan3.id, userId: admin.id, vote: 'APPROVE' },
      { loanId: loan3.id, userId: member2.id, vote: 'REJECT' },
    ],
  })

  // Create loan payment
  await prisma.loanPayment.create({
    data: {
      loanId: loan1.id,
      amount: 36000,
      note: 'Malipo ya kwanza',
    },
  })

  // Create activities
  const activities = [
    { userId: admin.id, groupId: group.id, action: 'Amechangia akiba', amount: 50000 },
    { userId: member1.id, groupId: group.id, action: 'Ameomba mkopo', amount: 100000 },
    { userId: member2.id, groupId: group.id, action: 'Amechangia akiba', amount: 45000 },
    { userId: admin.id, groupId: group.id, action: 'Mkopo umeidhinishwa', amount: 100000 },
    { userId: member1.id, groupId: group.id, action: 'Amelipa mkopo', amount: 36000 },
    { userId: member2.id, groupId: group.id, action: 'Ameomba mkopo', amount: 150000 },
    { userId: member3.id, groupId: group.id, action: 'Ameomba mkopo', amount: 80000 },
  ]

  for (const activity of activities) {
    await prisma.activity.create({ data: activity })
  }

  console.log('✅ Seeding complete!')
  console.log('👤 Login credentials:')
  console.log('   Admin: admin@kikoba.com / password123')
  console.log('   Member 1: john@kikoba.com / password123')
  console.log('   Member 2: mary@kikoba.com / password123')
  console.log('   Member 3: peter@kikoba.com / password123')
  console.log('🔑 Group join code: KIKOBA2024')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
