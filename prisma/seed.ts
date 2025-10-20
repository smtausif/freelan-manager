// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@fcc.app" },
    update: {},
    create: {
      email: "demo@fcc.app",
      name: "Demo User",
      companyName: "Freelancer Co.",
      currency: "CAD",
      taxRate: 13.0,
    },
  });

  const acme = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Acme Corp",
      email: "ap@acme.com",
      company: "Acme",
      notes: "Net 15",
    },
  });

  const beta = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Beta Studio",
      email: "ops@beta.studio",
      notes: "VIP",
    },
  });

  await prisma.project.createMany({
    data: [
      {
        userId: user.id,
        clientId: acme.id,
        name: "Website Revamp",
        billingType: "HOURLY",
        hourlyRate: 85.0,
      },
      {
        userId: user.id,
        clientId: beta.id,
        name: "Brand Identity",
        billingType: "FIXED",
        fixedFee: 3200.0,
      },
    ],
  });

  console.log("Seeded with demo user:", user.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => prisma.$disconnect());
