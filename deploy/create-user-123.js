const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const DEFAULT_CATEGORIES = [
  { name: '母婴', color: '#7CB342', sort: 1 },
  { name: '食品饮料', color: '#C62828', sort: 2 },
  { name: '日用清洁', color: '#1565C0', sort: 3 },
  { name: '衣物鞋帽', color: '#6A1B9A', sort: 4 },
  { name: '药品保健', color: '#00838F', sort: 5 },
  { name: '数码家电', color: '#37474F', sort: 6 },
  { name: '文具办公', color: '#EF6C00', sort: 7 },
  { name: '其它', color: '#5D4037', sort: 8 },
]

async function main() {
  const prisma = new PrismaClient()
  const username = '123'
  const password = '123'
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: exists.id },
      data: { passwordHash, nickname: '123' },
    })
    console.log('UPDATED user 123')
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        nickname: '123',
        categories: {
          create: DEFAULT_CATEGORIES.map((c) => ({ ...c, isSystem: true })),
        },
      },
    })
    console.log('CREATED user 123')
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
