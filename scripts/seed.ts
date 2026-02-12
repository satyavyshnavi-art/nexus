import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexus.com" },
    update: {},
    create: {
      email: "admin@nexus.com",
      passwordHash: adminPassword,
      name: "Admin User",
      role: "admin",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create demo user
  const userPassword = await hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@nexus.com" },
    update: {},
    create: {
      email: "user@nexus.com",
      passwordHash: userPassword,
      name: "Demo User",
      role: "member",
    },
  });

  console.log("Created demo user:", user.email);

  // Create vertical
  const vertical = await prisma.vertical.upsert({
    where: { name: "Engineering" },
    update: {},
    create: {
      name: "Engineering",
    },
  });

  console.log("Created vertical:", vertical.name);

  // Assign users to vertical
  await prisma.verticalUser.upsert({
    where: {
      verticalId_userId: {
        verticalId: vertical.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      verticalId: vertical.id,
      userId: admin.id,
    },
  });

  await prisma.verticalUser.upsert({
    where: {
      verticalId_userId: {
        verticalId: vertical.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      verticalId: vertical.id,
      userId: user.id,
    },
  });

  console.log("Assigned users to vertical");

  // Create project
  const project = await prisma.project.upsert({
    where: { id: "demo-project-id" },
    update: {},
    create: {
      id: "demo-project-id",
      name: "Demo Project",
      description: "A sample project to get started",
      verticalId: vertical.id,
      createdBy: admin.id,
    },
  });

  console.log("Created project:", project.name);

  // Add members to project
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: user.id,
    },
  });

  console.log("Added members to project");

  // Create sprint
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // 2 week sprint

  const sprint = await prisma.sprint.upsert({
    where: { id: "demo-sprint-id" },
    update: {},
    create: {
      id: "demo-sprint-id",
      name: "Sprint 1",
      projectId: project.id,
      startDate,
      endDate,
      status: "active",
      createdBy: admin.id,
    },
  });

  console.log("Created sprint:", sprint.name);

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      sprintId: sprint.id,
      title: "Set up project repository",
      description: "Initialize Git repository and configure CI/CD",
      type: "task",
      status: "done",
      priority: "high",
      storyPoints: 3,
      createdBy: admin.id,
      assigneeId: admin.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      sprintId: sprint.id,
      title: "Design database schema",
      description: "Create ERD and Prisma schema for the application",
      type: "task",
      status: "review",
      priority: "high",
      storyPoints: 5,
      createdBy: admin.id,
      assigneeId: user.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      sprintId: sprint.id,
      title: "Implement authentication",
      description: "Set up NextAuth.js with credentials provider",
      type: "task",
      status: "progress",
      priority: "critical",
      storyPoints: 8,
      createdBy: admin.id,
      assigneeId: admin.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      sprintId: sprint.id,
      title: "Create Kanban board UI",
      description: "Build drag-and-drop Kanban board with dnd-kit",
      type: "task",
      status: "todo",
      priority: "medium",
      storyPoints: 5,
      createdBy: admin.id,
    },
  });

  console.log("Created sample tasks");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@nexus.com / admin123");
  console.log("User: user@nexus.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
