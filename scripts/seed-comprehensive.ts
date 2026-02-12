import { PrismaClient, TaskStatus, TaskPriority, TaskType, SprintStatus } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating comprehensive seed data with full workflow...");

  // ==================== USERS ====================
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
  console.log("✅ Created admin");

  // Team members with specific roles
  const teamData = [
    { email: "sarah.frontend@nexus.com", name: "Sarah Johnson", role: "Frontend Lead" },
    { email: "mike.backend@nexus.com", name: "Mike Chen", role: "Backend Lead" },
    { email: "emily.design@nexus.com", name: "Emily Davis", role: "UI/UX Designer" },
    { email: "alex.devops@nexus.com", name: "Alex Kumar", role: "DevOps Engineer" },
    { email: "jessica.qa@nexus.com", name: "Jessica Martinez", role: "QA Engineer" },
    { email: "david.fullstack@nexus.com", name: "David Brown", role: "Full Stack" },
    { email: "lisa.database@nexus.com", name: "Lisa Wong", role: "DB Specialist" },
    { email: "tom.mobile@nexus.com", name: "Tom Wilson", role: "Mobile Dev" },
  ];

  const team = [];
  for (const member of teamData) {
    const password = await hash("member123", 10);
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: {
        email: member.email,
        passwordHash: password,
        name: member.name,
        role: "member",
      },
    });
    team.push(user);
  }
  console.log(`✅ Created ${team.length} team members`);

  // ==================== VERTICAL ====================
  const vertical = await prisma.vertical.upsert({
    where: { name: "Product Engineering" },
    update: {},
    create: { name: "Product Engineering" },
  });

  const allUsers = [admin, ...team];
  for (const user of allUsers) {
    await prisma.verticalUser.upsert({
      where: { verticalId_userId: { verticalId: vertical.id, userId: user.id } },
      update: {},
      create: { verticalId: vertical.id, userId: user.id },
    });
  }
  console.log("✅ Assigned users to vertical");

  // ==================== PROJECT ====================
  const project = await prisma.project.upsert({
    where: { id: "nexus-ecommerce" },
    update: {},
    create: {
      id: "nexus-ecommerce",
      name: "E-Commerce Platform v2",
      description: "Next-gen e-commerce platform with AI recommendations, real-time inventory, and mobile apps",
      verticalId: vertical.id,
      createdBy: admin.id,
    },
  });

  for (const user of allUsers) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
      update: {},
      create: { projectId: project.id, userId: user.id },
    });
  }
  console.log("✅ Created project with all members");

  // ==================== SPRINT 1 - COMPLETED ====================
  const sprint1Start = new Date();
  sprint1Start.setDate(sprint1Start.getDate() - 28);
  const sprint1End = new Date();
  sprint1End.setDate(sprint1End.getDate() - 14);

  const sprint1 = await prisma.sprint.upsert({
    where: { id: "sprint-1-foundation" },
    update: {},
    create: {
      id: "sprint-1-foundation",
      name: "Sprint 1 - Foundation",
      projectId: project.id,
      startDate: sprint1Start,
      endDate: sprint1End,
      status: SprintStatus.completed,
      createdBy: admin.id,
    },
  });

  // Sprint 1 Tickets (All DONE)
  const sprint1Tickets = [
    { title: "Project setup and configuration", type: TaskType.task, status: TaskStatus.done, priority: TaskPriority.critical, points: 5, assignee: team[0] },
    { title: "Database schema design", type: TaskType.task, status: TaskStatus.done, priority: TaskPriority.high, points: 8, assignee: team[6] },
    { title: "Authentication system", type: TaskType.task, status: TaskStatus.done, priority: TaskPriority.critical, points: 13, assignee: team[5] },
    { title: "Basic UI components", type: TaskType.task, status: TaskStatus.done, priority: TaskPriority.high, points: 5, assignee: team[2] },
  ];

  for (const ticket of sprint1Tickets) {
    await prisma.task.create({
      data: {
        sprintId: sprint1.id,
        title: ticket.title,
        description: `Completed in Sprint 1`,
        type: ticket.type,
        status: ticket.status,
        priority: ticket.priority,
        storyPoints: ticket.points,
        assigneeId: ticket.assignee.id,
        createdBy: admin.id,
      },
    });
  }
  console.log(`✅ Sprint 1 (Completed): ${sprint1Tickets.length} tickets`);

  // ==================== SPRINT 2 - ACTIVE (CURRENT) ====================
  const sprint2Start = new Date();
  sprint2Start.setDate(sprint2Start.getDate() - 7);
  const sprint2End = new Date();
  sprint2End.setDate(sprint2End.getDate() + 7);

  const sprint2 = await prisma.sprint.upsert({
    where: { id: "sprint-2-core-features" },
    update: {},
    create: {
      id: "sprint-2-core-features",
      name: "Sprint 2 - Core Features",
      projectId: project.id,
      startDate: sprint2Start,
      endDate: sprint2End,
      status: SprintStatus.active,
      createdBy: admin.id,
    },
  });

  // USER STORIES with child tasks for Sprint 2

  // STORY 1: Product Catalog
  const story1 = await prisma.task.create({
    data: {
      sprintId: sprint2.id,
      title: "As a customer, I want to browse products",
      description: "Implement complete product catalog with search, filters, and sorting",
      type: TaskType.story,
      status: TaskStatus.progress,
      priority: TaskPriority.critical,
      storyPoints: 21,
      assigneeId: team[0].id,
      createdBy: admin.id,
    },
  });

  const story1Tasks = [
    { title: "Build product listing page", status: TaskStatus.done, priority: TaskPriority.high, points: 8, assignee: team[0] },
    { title: "Implement search functionality", status: TaskStatus.progress, priority: TaskPriority.high, points: 5, assignee: team[1] },
    { title: "Add filter sidebar", status: TaskStatus.review, priority: TaskPriority.medium, points: 5, assignee: team[0] },
    { title: "Create product detail view", status: TaskStatus.todo, priority: TaskPriority.high, points: 3, assignee: team[0] },
  ];

  for (const task of story1Tasks) {
    await prisma.task.create({
      data: {
        sprintId: sprint2.id,
        parentTaskId: story1.id,
        title: task.title,
        description: `Subtask of: ${story1.title}`,
        type: TaskType.task,
        status: task.status,
        priority: task.priority,
        storyPoints: task.points,
        assigneeId: task.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  // STORY 2: Shopping Cart
  const story2 = await prisma.task.create({
    data: {
      sprintId: sprint2.id,
      title: "As a customer, I want to manage my cart",
      description: "Shopping cart with add, remove, update quantity, and checkout",
      type: TaskType.story,
      status: TaskStatus.progress,
      priority: TaskPriority.critical,
      storyPoints: 18,
      assigneeId: team[5].id,
      createdBy: admin.id,
    },
  });

  const story2Tasks = [
    { title: "Create cart API endpoints", status: TaskStatus.done, priority: TaskPriority.critical, points: 5, assignee: team[1] },
    { title: "Build cart UI component", status: TaskStatus.progress, priority: TaskPriority.high, points: 5, assignee: team[5] },
    { title: "Implement quantity controls", status: TaskStatus.review, priority: TaskPriority.medium, points: 3, assignee: team[5] },
    { title: "Add price calculation", status: TaskStatus.todo, priority: TaskPriority.high, points: 5, assignee: team[1] },
  ];

  for (const task of story2Tasks) {
    await prisma.task.create({
      data: {
        sprintId: sprint2.id,
        parentTaskId: story2.id,
        title: task.title,
        description: `Subtask of: ${story2.title}`,
        type: TaskType.task,
        status: task.status,
        priority: task.priority,
        storyPoints: task.points,
        assigneeId: task.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  // STORY 3: Order Management
  const story3 = await prisma.task.create({
    data: {
      sprintId: sprint2.id,
      title: "As a customer, I want to place orders",
      description: "Complete checkout flow with payment integration",
      type: TaskType.story,
      status: TaskStatus.todo,
      priority: TaskPriority.critical,
      storyPoints: 24,
      assigneeId: team[1].id,
      createdBy: admin.id,
    },
  });

  const story3Tasks = [
    { title: "Design checkout flow", status: TaskStatus.todo, priority: TaskPriority.high, points: 5, assignee: team[2] },
    { title: "Build payment integration", status: TaskStatus.todo, priority: TaskPriority.critical, points: 13, assignee: team[1] },
    { title: "Create order confirmation page", status: TaskStatus.todo, priority: TaskPriority.medium, points: 3, assignee: team[0] },
    { title: "Send order confirmation emails", status: TaskStatus.todo, priority: TaskPriority.medium, points: 3, assignee: team[1] },
  ];

  for (const task of story3Tasks) {
    await prisma.task.create({
      data: {
        sprintId: sprint2.id,
        parentTaskId: story3.id,
        title: task.title,
        description: `Subtask of: ${story3.title}`,
        type: TaskType.task,
        status: task.status,
        priority: task.priority,
        storyPoints: task.points,
        assigneeId: task.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  // BUGS for Sprint 2
  const bugs = [
    { title: "Cart total calculation incorrect for discounts", status: TaskStatus.progress, priority: TaskPriority.high, assignee: team[1] },
    { title: "Search results not showing all products", status: TaskStatus.review, priority: TaskPriority.medium, assignee: team[1] },
    { title: "Mobile navigation menu not closing", status: TaskStatus.done, priority: TaskPriority.medium, assignee: team[0] },
  ];

  for (const bug of bugs) {
    await prisma.task.create({
      data: {
        sprintId: sprint2.id,
        title: bug.title,
        description: "Bug fix required",
        type: TaskType.bug,
        status: bug.status,
        priority: bug.priority,
        storyPoints: 3,
        assigneeId: bug.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  // STANDALONE TASKS for Sprint 2
  const standaloneTasks = [
    { title: "Setup monitoring and logging", status: TaskStatus.done, priority: TaskPriority.high, points: 5, assignee: team[3] },
    { title: "Write API documentation", status: TaskStatus.progress, priority: TaskPriority.medium, points: 5, assignee: team[1] },
    { title: "Create unit tests for cart module", status: TaskStatus.todo, priority: TaskPriority.high, points: 8, assignee: team[4] },
    { title: "Optimize database queries", status: TaskStatus.todo, priority: TaskPriority.medium, points: 5, assignee: team[6] },
  ];

  for (const task of standaloneTasks) {
    await prisma.task.create({
      data: {
        sprintId: sprint2.id,
        title: task.title,
        description: "Standalone task for Sprint 2",
        type: TaskType.task,
        status: task.status,
        priority: task.priority,
        storyPoints: task.points,
        assigneeId: task.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  console.log(`✅ Sprint 2 (Active): 3 stories + 12 subtasks + 3 bugs + 4 standalone = 22 tickets`);

  // ==================== SPRINT 3 - PLANNED ====================
  const sprint3Start = new Date();
  sprint3Start.setDate(sprint3Start.getDate() + 7);
  const sprint3End = new Date();
  sprint3End.setDate(sprint3End.getDate() + 21);

  const sprint3 = await prisma.sprint.upsert({
    where: { id: "sprint-3-advanced" },
    update: {},
    create: {
      id: "sprint-3-advanced",
      name: "Sprint 3 - Advanced Features",
      projectId: project.id,
      startDate: sprint3Start,
      endDate: sprint3End,
      status: SprintStatus.planned,
      createdBy: admin.id,
    },
  });

  // Sprint 3 planned tickets
  const sprint3Stories = [
    { title: "As a customer, I want personalized recommendations", type: TaskType.story, priority: TaskPriority.medium, points: 21, assignee: team[1] },
    { title: "As a customer, I want to track my orders", type: TaskType.story, priority: TaskPriority.high, points: 13, assignee: team[5] },
    { title: "As an admin, I want to manage inventory", type: TaskType.story, priority: TaskPriority.critical, points: 21, assignee: team[6] },
  ];

  for (const story of sprint3Stories) {
    await prisma.task.create({
      data: {
        sprintId: sprint3.id,
        title: story.title,
        description: "Planned for Sprint 3",
        type: story.type,
        status: TaskStatus.todo,
        priority: story.priority,
        storyPoints: story.points,
        assigneeId: story.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  const sprint3Tasks = [
    { title: "Build mobile app (iOS)", priority: TaskPriority.high, points: 21, assignee: team[7] },
    { title: "Build mobile app (Android)", priority: TaskPriority.high, points: 21, assignee: team[7] },
    { title: "Implement push notifications", priority: TaskPriority.medium, points: 8, assignee: team[7] },
  ];

  for (const task of sprint3Tasks) {
    await prisma.task.create({
      data: {
        sprintId: sprint3.id,
        title: task.title,
        description: "Planned mobile development",
        type: TaskType.task,
        status: TaskStatus.todo,
        priority: task.priority,
        storyPoints: task.points,
        assigneeId: task.assignee.id,
        createdBy: admin.id,
      },
    });
  }

  console.log(`✅ Sprint 3 (Planned): 3 stories + 3 mobile tasks = 6 tickets`);

  // ==================== BACKLOG (No Sprint) ====================
  const backlogItems = [
    { title: "As a customer, I want wish lists", type: TaskType.story, priority: TaskPriority.low, points: 8 },
    { title: "As a customer, I want product reviews", type: TaskType.story, priority: TaskPriority.medium, points: 13 },
    { title: "Social media integration", type: TaskType.task, priority: TaskPriority.low, points: 5 },
    { title: "Email marketing campaigns", type: TaskType.task, priority: TaskPriority.low, points: 8 },
  ];

  for (const item of backlogItems) {
    await prisma.task.create({
      data: {
        sprintId: sprint2.id, // Assign to current sprint but mark as backlog via status
        title: `[BACKLOG] ${item.title}`,
        description: "In product backlog, not assigned to sprint yet",
        type: item.type,
        status: TaskStatus.todo,
        priority: item.priority,
        storyPoints: item.points,
        createdBy: admin.id,
      },
    });
  }

  console.log(`✅ Backlog: 4 items`);

  console.log("\n✨ Comprehensive seed completed!");
  console.log("\n📊 Summary:");
  console.log("├─ Sprints: 3 (1 completed, 1 active, 1 planned)");
  console.log("├─ Total Tickets: 56");
  console.log("│  ├─ Sprint 1 (Completed): 4 tickets");
  console.log("│  ├─ Sprint 2 (Active): 22 tickets (3 stories, 12 subtasks, 3 bugs, 4 tasks)");
  console.log("│  ├─ Sprint 3 (Planned): 6 tickets");
  console.log("│  └─ Backlog: 4 items");
  console.log("└─ Team: 8 members + 1 admin");

  console.log("\n🔐 Login:");
  console.log("Admin: admin@nexus.com / admin123");
  console.log("All members: [name]@nexus.com / member123");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
