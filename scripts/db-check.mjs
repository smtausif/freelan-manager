import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({ take: 3 });
  console.log("Projects:", projects.map(p => ({ id: p.id, name: p.name })));
  if (projects.length) {
    const pid = projects[0].id;
    const tasks = await prisma.projectTask.findMany({ where: { projectId: pid } });
    console.log("Tasks for first project:", tasks.length);
  }
}

main().catch(e => {
  console.error("DB check error", e);
}).finally(async () => prisma.$disconnect());

