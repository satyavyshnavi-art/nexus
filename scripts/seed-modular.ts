import { PrismaClient, TaskStatus, TaskPriority, TaskType, SprintStatus } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting modular database seed...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.taskComment.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.verticalUser.deleteMany();
  await prisma.vertical.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleared\n");

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@nexus.com",
      passwordHash: await hash("admin123", 10),
      name: "Admin User",
      role: "admin",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create team members
  const teamMembers = await Promise.all([
    // Frontend Team
    prisma.user.create({
      data: {
        email: "sarah.frontend@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Sarah Johnson",
        role: "member",
      },
    }),
    prisma.user.create({
      data: {
        email: "tom.ui@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Tom Rivera",
        role: "member",
      },
    }),
    // Backend Team
    prisma.user.create({
      data: {
        email: "mike.backend@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Mike Chen",
        role: "member",
      },
    }),
    prisma.user.create({
      data: {
        email: "priya.api@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Priya Sharma",
        role: "member",
      },
    }),
    // Design Team
    prisma.user.create({
      data: {
        email: "emily.design@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Emily Davis",
        role: "member",
      },
    }),
    prisma.user.create({
      data: {
        email: "carlos.ux@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Carlos Martinez",
        role: "member",
      },
    }),
    // DevOps Team
    prisma.user.create({
      data: {
        email: "alex.devops@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Alex Kumar",
        role: "member",
      },
    }),
    // QA Team
    prisma.user.create({
      data: {
        email: "jessica.qa@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Jessica White",
        role: "member",
      },
    }),
    // Full Stack
    prisma.user.create({
      data: {
        email: "david.fullstack@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "David Brown",
        role: "member",
      },
    }),
    // Database
    prisma.user.create({
      data: {
        email: "lisa.database@nexus.com",
        passwordHash: await hash("password123", 10),
        name: "Lisa Wong",
        role: "member",
      },
    }),
  ]);
  console.log(`✅ Created ${teamMembers.length} team members\n`);

  // ========================================
  // VERTICAL 1: Product Engineering
  // ========================================
  const productEngineering = await prisma.vertical.create({
    data: { name: "Product Engineering" },
  });
  console.log("📁 Vertical:", productEngineering.name);

  // Assign all users to this vertical
  await Promise.all([
    ...teamMembers.map((member) =>
      prisma.verticalUser.create({
        data: {
          verticalId: productEngineering.id,
          userId: member.id,
        },
      })
    ),
    prisma.verticalUser.create({
      data: {
        verticalId: productEngineering.id,
        userId: admin.id,
      },
    }),
  ]);

  // PROJECT 1: Customer Portal Module
  const customerPortal = await prisma.project.create({
    data: {
      name: "Customer Portal Module",
      description: "Self-service customer portal with account management, order tracking, and support",
      verticalId: productEngineering.id,
      createdBy: admin.id,
    },
  });
  console.log("  📦 Project:", customerPortal.name);

  // Assign members to Customer Portal
  await Promise.all([
    prisma.projectMember.create({ data: { projectId: customerPortal.id, userId: teamMembers[0].id } }), // Sarah (Frontend)
    prisma.projectMember.create({ data: { projectId: customerPortal.id, userId: teamMembers[2].id } }), // Mike (Backend)
    prisma.projectMember.create({ data: { projectId: customerPortal.id, userId: teamMembers[4].id } }), // Emily (Design)
    prisma.projectMember.create({ data: { projectId: customerPortal.id, userId: teamMembers[7].id } }), // Jessica (QA)
    prisma.projectMember.create({ data: { projectId: customerPortal.id, userId: admin.id } }),
  ]);

  // Sprint 1: Foundation (ACTIVE)
  const portalSprint1 = await prisma.sprint.create({
    data: {
      projectId: customerPortal.id,
      name: "Sprint 1 - Portal Foundation",
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-24"),
      status: SprintStatus.active,
      createdBy: admin.id,
    },
  });

  // Create tasks for Portal Sprint 1
  const portalTasks = [
    // Todo
    { title: "Design customer dashboard wireframes", status: TaskStatus.todo, priority: TaskPriority.high, assigneeId: teamMembers[4].id, storyPoints: 5 },
    { title: "Implement user authentication flow", status: TaskStatus.todo, priority: TaskPriority.critical, assigneeId: teamMembers[2].id, storyPoints: 8 },
    { title: "Create profile management API", status: TaskStatus.todo, priority: TaskPriority.high, assigneeId: teamMembers[2].id, storyPoints: 5 },

    // In Progress
    { title: "Build customer dashboard UI", status: TaskStatus.progress, priority: TaskPriority.high, assigneeId: teamMembers[0].id, storyPoints: 8 },
    { title: "Implement order history view", status: TaskStatus.progress, priority: TaskPriority.medium, assigneeId: teamMembers[0].id, storyPoints: 5 },
    { title: "Setup database schema for customers", status: TaskStatus.progress, priority: TaskPriority.critical, assigneeId: teamMembers[2].id, storyPoints: 8 },

    // Review
    { title: "Create login/signup pages", status: TaskStatus.review, priority: TaskPriority.high, assigneeId: teamMembers[0].id, storyPoints: 5 },
    { title: "Implement password reset functionality", status: TaskStatus.review, priority: TaskPriority.medium, assigneeId: teamMembers[2].id, storyPoints: 3 },

    // Done
    { title: "Setup project structure", status: TaskStatus.done, priority: TaskPriority.critical, assigneeId: teamMembers[0].id, storyPoints: 3 },
    { title: "Configure authentication middleware", status: TaskStatus.done, priority: TaskPriority.high, assigneeId: teamMembers[2].id, storyPoints: 5 },
    { title: "Design system setup", status: TaskStatus.done, priority: TaskPriority.medium, assigneeId: teamMembers[4].id, storyPoints: 5 },
    { title: "Test plan creation", status: TaskStatus.done, priority: TaskPriority.medium, assigneeId: teamMembers[7].id, storyPoints: 3 },
  ];

  await prisma.task.createMany({
    data: portalTasks.map((task) => ({
      ...task,
      sprintId: portalSprint1.id,
      type: TaskType.task,
      createdBy: admin.id,
    })),
  });
  console.log(`    ✅ Sprint: ${portalSprint1.name} (${portalTasks.length} tasks)`);

  // PROJECT 2: Payment Gateway Module
  const paymentGateway = await prisma.project.create({
    data: {
      name: "Payment Gateway Module",
      description: "Secure payment processing system with multiple payment methods and fraud detection",
      verticalId: productEngineering.id,
      createdBy: admin.id,
    },
  });
  console.log("  📦 Project:", paymentGateway.name);

  // Assign members to Payment Gateway
  await Promise.all([
    prisma.projectMember.create({ data: { projectId: paymentGateway.id, userId: teamMembers[2].id } }), // Mike (Backend)
    prisma.projectMember.create({ data: { projectId: paymentGateway.id, userId: teamMembers[3].id } }), // Priya (API)
    prisma.projectMember.create({ data: { projectId: paymentGateway.id, userId: teamMembers[6].id } }), // Alex (DevOps)
    prisma.projectMember.create({ data: { projectId: paymentGateway.id, userId: teamMembers[7].id } }), // Jessica (QA)
    prisma.projectMember.create({ data: { projectId: paymentGateway.id, userId: teamMembers[9].id } }), // Lisa (Database)
    prisma.projectMember.create({ data: { projectId: paymentGateway.id, userId: admin.id } }),
  ]);

  // Sprint 1: Payment Core (ACTIVE)
  const paymentSprint1 = await prisma.sprint.create({
    data: {
      projectId: paymentGateway.id,
      name: "Sprint 1 - Payment Core",
      startDate: new Date("2026-02-03"),
      endDate: new Date("2026-02-17"),
      status: SprintStatus.active,
      createdBy: admin.id,
    },
  });

  const paymentTasks = [
    // Todo
    { title: "Integrate Stripe payment API", status: TaskStatus.todo, priority: TaskPriority.critical, assigneeId: teamMembers[3].id, storyPoints: 13, type: TaskType.task },
    { title: "Implement payment webhooks handler", status: TaskStatus.todo, priority: TaskPriority.high, assigneeId: teamMembers[2].id, storyPoints: 8, type: TaskType.task },
    { title: "Setup fraud detection rules", status: TaskStatus.todo, priority: TaskPriority.high, assigneeId: teamMembers[3].id, storyPoints: 8, type: TaskType.task },

    // In Progress
    { title: "Create payment transaction database", status: TaskStatus.progress, priority: TaskPriority.critical, assigneeId: teamMembers[9].id, storyPoints: 8, type: TaskType.task },
    { title: "Build payment processing service", status: TaskStatus.progress, priority: TaskPriority.critical, assigneeId: teamMembers[2].id, storyPoints: 13, type: TaskType.task },
    { title: "Implement payment retry logic", status: TaskStatus.progress, priority: TaskPriority.medium, assigneeId: teamMembers[3].id, storyPoints: 5, type: TaskType.task },

    // Review
    { title: "Setup secure payment endpoints", status: TaskStatus.review, priority: TaskPriority.critical, assigneeId: teamMembers[2].id, storyPoints: 5, type: TaskType.task },
    { title: "Configure payment encryption", status: TaskStatus.review, priority: TaskPriority.critical, assigneeId: teamMembers[6].id, storyPoints: 8, type: TaskType.task },

    // Done
    { title: "Setup payment gateway infrastructure", status: TaskStatus.done, priority: TaskPriority.critical, assigneeId: teamMembers[6].id, storyPoints: 8, type: TaskType.task },
    { title: "Create payment service architecture", status: TaskStatus.done, priority: TaskPriority.high, assigneeId: teamMembers[2].id, storyPoints: 5, type: TaskType.task },
    { title: "Security audit preparation", status: TaskStatus.done, priority: TaskPriority.high, assigneeId: teamMembers[7].id, storyPoints: 3, type: TaskType.task },
  ];

  await prisma.task.createMany({
    data: paymentTasks.map((task) => ({
      ...task,
      sprintId: paymentSprint1.id,
      createdBy: admin.id,
    })),
  });
  console.log(`    ✅ Sprint: ${paymentSprint1.name} (${paymentTasks.length} tasks)`);

  // PROJECT 3: Admin Dashboard Module
  const adminDashboard = await prisma.project.create({
    data: {
      name: "Admin Dashboard Module",
      description: "Comprehensive admin panel for managing users, orders, analytics, and system settings",
      verticalId: productEngineering.id,
      createdBy: admin.id,
    },
  });
  console.log("  📦 Project:", adminDashboard.name);

  // Assign members
  await Promise.all([
    prisma.projectMember.create({ data: { projectId: adminDashboard.id, userId: teamMembers[0].id } }), // Sarah (Frontend)
    prisma.projectMember.create({ data: { projectId: adminDashboard.id, userId: teamMembers[1].id } }), // Tom (UI)
    prisma.projectMember.create({ data: { projectId: adminDashboard.id, userId: teamMembers[2].id } }), // Mike (Backend)
    prisma.projectMember.create({ data: { projectId: adminDashboard.id, userId: teamMembers[4].id } }), // Emily (Design)
    prisma.projectMember.create({ data: { projectId: adminDashboard.id, userId: teamMembers[8].id } }), // David (Fullstack)
    prisma.projectMember.create({ data: { projectId: adminDashboard.id, userId: admin.id } }),
  ]);

  // Sprint 1: Dashboard Foundation (ACTIVE)
  const adminSprint1 = await prisma.sprint.create({
    data: {
      projectId: adminDashboard.id,
      name: "Sprint 1 - Dashboard Foundation",
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-24"),
      status: SprintStatus.active,
      createdBy: admin.id,
    },
  });

  const adminTasks = [
    // User Stories with subtasks
    { title: "User Management System", status: TaskStatus.progress, priority: TaskPriority.critical, assigneeId: null, storyPoints: 21, type: TaskType.story },
    { title: "Analytics Dashboard", status: TaskStatus.todo, priority: TaskPriority.high, assigneeId: null, storyPoints: 13, type: TaskType.story },

    // Regular tasks
    { title: "Build sidebar navigation", status: TaskStatus.done, priority: TaskPriority.high, assigneeId: teamMembers[1].id, storyPoints: 5, type: TaskType.task },
    { title: "Create data visualization components", status: TaskStatus.progress, priority: TaskPriority.medium, assigneeId: teamMembers[0].id, storyPoints: 8, type: TaskType.task },
    { title: "Implement real-time notifications", status: TaskStatus.progress, priority: TaskPriority.medium, assigneeId: teamMembers[8].id, storyPoints: 8, type: TaskType.task },
    { title: "Setup admin authentication", status: TaskStatus.done, priority: TaskPriority.critical, assigneeId: teamMembers[2].id, storyPoints: 5, type: TaskType.task },
    { title: "Design admin UI mockups", status: TaskStatus.done, priority: TaskPriority.high, assigneeId: teamMembers[4].id, storyPoints: 8, type: TaskType.task },
    { title: "Build settings management panel", status: TaskStatus.todo, priority: TaskPriority.medium, assigneeId: teamMembers[0].id, storyPoints: 5, type: TaskType.task },

    // Bugs
    { title: "Fix dashboard loading performance", status: TaskStatus.review, priority: TaskPriority.high, assigneeId: teamMembers[8].id, storyPoints: 3, type: TaskType.bug },
    { title: "Resolve navigation menu mobile bug", status: TaskStatus.progress, priority: TaskPriority.medium, assigneeId: teamMembers[1].id, storyPoints: 2, type: TaskType.bug },
  ];

  const createdAdminTasks = await prisma.task.createManyAndReturn({
    data: adminTasks.map((task) => ({
      ...task,
      sprintId: adminSprint1.id,
      createdBy: admin.id,
    })),
  });

  // Create subtasks for User Management story
  const userStory = createdAdminTasks.find(t => t.title === "User Management System");
  if (userStory) {
    await prisma.task.createMany({
      data: [
        {
          title: "Create user list view with pagination",
          status: TaskStatus.done,
          priority: TaskPriority.high,
          assigneeId: teamMembers[0].id,
          storyPoints: 5,
          type: TaskType.task,
          sprintId: adminSprint1.id,
          parentTaskId: userStory.id,
          createdBy: admin.id,
        },
        {
          title: "Implement user creation form",
          status: TaskStatus.progress,
          priority: TaskPriority.high,
          assigneeId: teamMembers[0].id,
          storyPoints: 3,
          type: TaskType.task,
          sprintId: adminSprint1.id,
          parentTaskId: userStory.id,
          createdBy: admin.id,
        },
        {
          title: "Build user role management API",
          status: TaskStatus.progress,
          priority: TaskPriority.critical,
          assigneeId: teamMembers[2].id,
          storyPoints: 8,
          type: TaskType.task,
          sprintId: adminSprint1.id,
          parentTaskId: userStory.id,
          createdBy: admin.id,
        },
        {
          title: "Add user search and filters",
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
          assigneeId: teamMembers[0].id,
          storyPoints: 5,
          type: TaskType.task,
          sprintId: adminSprint1.id,
          parentTaskId: userStory.id,
          createdBy: admin.id,
        },
      ],
    });
  }

  console.log(`    ✅ Sprint: ${adminSprint1.name} (${adminTasks.length + 4} tasks with subtasks)`);

  // Sprint 2: Advanced Features (PLANNED)
  const adminSprint2 = await prisma.sprint.create({
    data: {
      projectId: adminDashboard.id,
      name: "Sprint 2 - Advanced Features",
      startDate: new Date("2026-02-24"),
      endDate: new Date("2026-03-10"),
      status: SprintStatus.planned,
      createdBy: admin.id,
    },
  });

  await prisma.task.createMany({
    data: [
      { title: "Implement advanced analytics", status: TaskStatus.todo, priority: TaskPriority.medium, assigneeId: teamMembers[8].id, storyPoints: 13, type: TaskType.task, sprintId: adminSprint2.id, createdBy: admin.id },
      { title: "Build export functionality", status: TaskStatus.todo, priority: TaskPriority.low, assigneeId: teamMembers[0].id, storyPoints: 5, type: TaskType.task, sprintId: adminSprint2.id, createdBy: admin.id },
      { title: "Add email notification system", status: TaskStatus.todo, priority: TaskPriority.medium, assigneeId: teamMembers[2].id, storyPoints: 8, type: TaskType.task, sprintId: adminSprint2.id, createdBy: admin.id },
      { title: "Create activity log viewer", status: TaskStatus.todo, priority: TaskPriority.low, assigneeId: teamMembers[1].id, storyPoints: 5, type: TaskType.task, sprintId: adminSprint2.id, createdBy: admin.id },
    ],
  });
  console.log(`    ✅ Sprint: ${adminSprint2.name} (4 tasks - planned)`);

  // ========================================
  // VERTICAL 2: Mobile Engineering
  // ========================================
  const mobileEngineering = await prisma.vertical.create({
    data: { name: "Mobile Engineering" },
  });
  console.log("\n📁 Vertical:", mobileEngineering.name);

  // Assign some users to mobile
  await Promise.all([
    prisma.verticalUser.create({ data: { verticalId: mobileEngineering.id, userId: teamMembers[0].id } }),
    prisma.verticalUser.create({ data: { verticalId: mobileEngineering.id, userId: teamMembers[1].id } }),
    prisma.verticalUser.create({ data: { verticalId: mobileEngineering.id, userId: teamMembers[4].id } }),
    prisma.verticalUser.create({ data: { verticalId: mobileEngineering.id, userId: teamMembers[7].id } }),
    prisma.verticalUser.create({ data: { verticalId: mobileEngineering.id, userId: admin.id } }),
  ]);

  // PROJECT 4: Mobile App Module
  const mobileApp = await prisma.project.create({
    data: {
      name: "Mobile App Module",
      description: "Native mobile application for iOS and Android with offline support",
      verticalId: mobileEngineering.id,
      createdBy: admin.id,
    },
  });
  console.log("  📦 Project:", mobileApp.name);

  await Promise.all([
    prisma.projectMember.create({ data: { projectId: mobileApp.id, userId: teamMembers[0].id } }),
    prisma.projectMember.create({ data: { projectId: mobileApp.id, userId: teamMembers[1].id } }),
    prisma.projectMember.create({ data: { projectId: mobileApp.id, userId: teamMembers[4].id } }),
    prisma.projectMember.create({ data: { projectId: mobileApp.id, userId: teamMembers[7].id } }),
    prisma.projectMember.create({ data: { projectId: mobileApp.id, userId: admin.id } }),
  ]);

  const mobileSprint = await prisma.sprint.create({
    data: {
      projectId: mobileApp.id,
      name: "Sprint 1 - MVP",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-02-15"),
      status: SprintStatus.active,
      createdBy: admin.id,
    },
  });

  await prisma.task.createMany({
    data: [
      { title: "Setup React Native project", status: TaskStatus.done, priority: TaskPriority.critical, assigneeId: teamMembers[0].id, storyPoints: 5, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
      { title: "Design mobile app screens", status: TaskStatus.done, priority: TaskPriority.high, assigneeId: teamMembers[4].id, storyPoints: 8, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
      { title: "Implement navigation", status: TaskStatus.progress, priority: TaskPriority.high, assigneeId: teamMembers[0].id, storyPoints: 5, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
      { title: "Build home screen", status: TaskStatus.progress, priority: TaskPriority.high, assigneeId: teamMembers[1].id, storyPoints: 8, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
      { title: "Implement offline mode", status: TaskStatus.todo, priority: TaskPriority.medium, assigneeId: teamMembers[0].id, storyPoints: 13, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
      { title: "Setup push notifications", status: TaskStatus.todo, priority: TaskPriority.medium, assigneeId: teamMembers[1].id, storyPoints: 5, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
      { title: "Mobile testing framework", status: TaskStatus.review, priority: TaskPriority.high, assigneeId: teamMembers[7].id, storyPoints: 5, type: TaskType.task, sprintId: mobileSprint.id, createdBy: admin.id },
    ],
  });
  console.log(`    ✅ Sprint: ${mobileSprint.name} (7 tasks)`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED COMPLETE!");
  console.log("=".repeat(50));

  const finalCounts = await Promise.all([
    prisma.user.count(),
    prisma.vertical.count(),
    prisma.project.count(),
    prisma.sprint.count(),
    prisma.task.count(),
    prisma.projectMember.count(),
  ]);

  console.log("\n📊 Database Summary:");
  console.log("  Users:", finalCounts[0]);
  console.log("  Verticals:", finalCounts[1]);
  console.log("  Projects:", finalCounts[2]);
  console.log("  Sprints:", finalCounts[3]);
  console.log("  Tasks:", finalCounts[4]);
  console.log("  Project Memberships:", finalCounts[5]);

  console.log("\n🔑 Login Credentials:");
  console.log("  Admin: admin@nexus.com / admin123");
  console.log("  Members: [name]@nexus.com / password123");
  console.log("\n✨ All projects have ACTIVE sprints with tasks in Kanban!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
