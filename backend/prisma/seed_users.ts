import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { UserTypes } from '../src/resources/userType/userType.constants';

const prisma = new PrismaClient();

// ==========================================
// CONFIGURAÇÕES — edite aqui
// ==========================================
const TOTAL_USERS = 100;
const BASE_NAME = 'User';
const BASE_EMAIL = 'user';
const EMAIL_DOMAIN = 'test.com';
const DEFAULT_PASSWORD = 'senha123';
// ==========================================

async function main() {
  console.log(`\nCriando ${TOTAL_USERS} usuários...\n`);

  const passwordHash = await hash(DEFAULT_PASSWORD, 10);

  let success = 0;
  let failed = 0;

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const name = `${BASE_NAME} ${i}`;
    const email = `${BASE_EMAIL}${i}@${EMAIL_DOMAIN}`;

    try {
      await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          userTypeId: UserTypes.CLIENT,
        },
      });
      console.log(`[${i}/${TOTAL_USERS}] Criado: ${name} <${email}>`);
      success++;
    } catch (err: any) {
      // P2002 = unique constraint (email já existe)
      const msg = err.code === 'P2002' ? 'email já existe' : err.message;
      console.error(`[${i}/${TOTAL_USERS}] Erro em ${email}: ${msg}`);
      failed++;
    }
  }

  console.log(`\nResultado: ${success} criados, ${failed} erros.\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });