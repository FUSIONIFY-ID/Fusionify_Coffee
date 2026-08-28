import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { StaffRole } from '../src/generated/prisma/enums';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/auth/crypto.util';

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.STAFF_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const fullName = process.env.STAFF_BOOTSTRAP_NAME?.trim();
const password = process.env.STAFF_BOOTSTRAP_PASSWORD;

if (!databaseUrl || !email || !fullName || !password) {
  throw new Error(
    'DATABASE_URL, STAFF_BOOTSTRAP_EMAIL, STAFF_BOOTSTRAP_NAME, and STAFF_BOOTSTRAP_PASSWORD are required.',
  );
}

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
