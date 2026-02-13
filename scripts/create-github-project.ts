import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the admin user (satyavyshnavi or admin@nexus.com)
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'satyavyshnavi' } },
        { email: 'admin@nexus.com' },
        { role: 'admin' }
      ]
    }
  });

  if (!admin) {
    console.error('Admin user not found!');
    process.exit(1);
  }

  console.log(`Found admin: ${admin.email} (${admin.name})`);

  // Find or create a vertical
  let vertical = await prisma.vertical.findFirst({
    where: { name: 'Engineering' }
  });

  if (!vertical) {
    vertical = await prisma.vertical.create({
      data: { name: 'Engineering' }
    });
    console.log('Created vertical: Engineering');
  } else {
    console.log(`Using vertical: ${vertical.name}`);
  }

  // Add admin to vertical if not already
  const verticalMember = await prisma.verticalUser.findFirst({
    where: {
      verticalId: vertical.id,
      userId: admin.id
    }
  });

  if (!verticalMember) {
    await prisma.verticalUser.create({
      data: {
        verticalId: vertical.id,
        userId: admin.id
      }
    });
    console.log('Added admin to vertical');
  }

  // Create a new project for GitHub testing
  const project = await prisma.project.create({
    data: {
      name: 'GitHub Integration Test',
      description: 'Test project for linking GitHub repositories and syncing tasks as issues',
      verticalId: vertical.id,
      createdBy: admin.id,
      members: {
        create: [
          {
            userId: admin.id
          }
        ]
      }
    }
  });

  console.log(`✅ Created project: ${project.name} (ID: ${project.id})`);

  // Create an active sprint for the project
  const sprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - GitHub Integration',
      projectId: project.id,
      createdBy: admin.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      status: 'active'
    }
  });

  console.log(`✅ Created active sprint: ${sprint.name} (ID: ${sprint.id})`);

  // Create a sample task
  await prisma.task.create({
    data: {
      title: 'Test GitHub Issue Sync',
      description: 'This task can be synced to GitHub as an issue',
      sprintId: sprint.id,
      createdBy: admin.id,
      assigneeId: admin.id,
      type: 'task',
      status: 'todo',
      priority: 'medium'
    }
  });

  console.log('✅ Created sample task');

  console.log('\n🎉 Project setup complete!');
  console.log(`\nProject ID: ${project.id}`);
  console.log(`Project URL (Local): http://localhost:3000/projects/${project.id}`);
  console.log(`Project URL (Prod): https://nexus-rosy-nine.vercel.app/projects/${project.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
