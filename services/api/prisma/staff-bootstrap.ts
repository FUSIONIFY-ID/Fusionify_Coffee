import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/auth/crypto.util';
import { PrismaClient } from '../src/generated/prisma/client';
import { StaffRole } from '../src/generated/prisma/enums';

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

const databaseUrl = requireEnv('DATABASE_URL');
const email = requireEnv('STAFF_BOOTSTRAP_EMAIL').toLowerCase();
const fullName = requireEnv('STAFF_BOOTSTRAP_NAME');
const password = requireEnv('STAFF_BOOTSTRAP_PASSWORD');

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) {
    throw new Error('A staff account already exists for this email.');
  }

  await prisma.staffUser.create({
    data: {
      email,
      fullName,
      passwordHash: await hashPassword(password),
      role: StaffRole.SUPER_ADMIN,
    },
  });

  console.log(
    'Initial SUPER_ADMIN created. TOTP enrollment is required on first login.',
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
