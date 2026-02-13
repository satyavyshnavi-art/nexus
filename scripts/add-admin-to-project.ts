import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the actual admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@nexus.com' }
  });

  if (!admin) {
    console.error('admin@nexus.com not found!');
    process.exit(1);
  }

  console.log(`Found admin: ${admin.name}`);

  const projectId = '983cd7b4-d2c7-4191-b183-097735bce935';

  // Check if already a member
  const existing = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: admin.id
    }
  });

  if (existing) {
    console.log('Admin already a member!');
    return;
  }

  // Add admin as member
  await prisma.projectMember.create({
    data: {
      projectId,
      userId: admin.id
    }
  });

  // Also add to vertical
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { vertical: true }
  });

  if (project) {
    const verticalMember = await prisma.verticalUser.findFirst({
      where: {
        verticalId: project.verticalId,
        userId: admin.id
      }
    });

    if (!verticalMember) {
      await prisma.verticalUser.create({
        data: {
          verticalId: project.verticalId,
          userId: admin.id
        }
      });
      console.log(`✅ Added admin to ${project.vertical.name} vertical`);
    }
  }

  console.log('✅ Added admin@nexus.com to project');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
