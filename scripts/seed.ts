import { PrismaClient, TaskStatus, TaskPriority } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
  console.log("✅ Created admin user:", admin.email);

  // Create team members with specific roles/skills
  const teamData = [
    { email: "sarah.johnson@nexus.com", name: "Sarah Johnson" }, // Frontend Lead
    { email: "mike.chen@nexus.com", name: "Mike Chen" }, // Backend Lead
    { email: "emily.davis@nexus.com", name: "Emily Davis" }, // UI/UX Designer
    { email: "alex.kumar@nexus.com", name: "Alex Kumar" }, // DevOps Engineer
    { email: "jessica.martinez@nexus.com", name: "Jessica Martinez" }, // QA Engineer
    { email: "david.brown@nexus.com", name: "David Brown" }, // Full Stack Dev
    { email: "lisa.wong@nexus.com", name: "Lisa Wong" }, // Database Specialist
  ];

  const teamMembers = [];
  for (const memberInfo of teamData) {
    const memberPassword = await hash("member123", 10);
    const member = await prisma.user.upsert({
      where: { email: memberInfo.email },
      update: {},
      create: {
        email: memberInfo.email,
        passwordHash: memberPassword,
        name: memberInfo.name,
        role: "developer",
      },
    });
    teamMembers.push(member);
  }
  console.log(`✅ Created ${teamMembers.length} team members`);

  // Create vertical
  const vertical = await prisma.vertical.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });
  console.log("✅ Created vertical:", vertical.name);

  // Assign all users to vertical
  const allUsers = [admin, ...teamMembers];
  for (const user of allUsers) {
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
  }
  console.log("✅ Assigned all users to vertical");

  // Create E-Commerce Platform project
  const project = await prisma.project.upsert({
    where: { id: "ecommerce-platform" },
    update: {},
    create: {
      id: "ecommerce-platform",
      name: "E-Commerce Platform",
      description: "Modern e-commerce platform with AI-powered recommendations and real-time inventory management",
      verticalId: vertical.id,
      createdBy: admin.id,
    },
  });
  console.log("✅ Created project:", project.name);

  // Add all users as project members
  for (const user of allUsers) {
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
  }
  console.log("✅ Added all members to project");

  // Create Sprint 1
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // 2 week sprint

  const sprint = await prisma.sprint.upsert({
    where: { id: "sprint-1-ecommerce" },
    update: {},
    create: {
      id: "sprint-1-ecommerce",
      name: "Sprint 1 - Foundation & Core Features",
      projectId: project.id,
      startDate,
      endDate,
      status: "active",
      createdBy: admin.id,
    },
  });
  console.log("✅ Created sprint:", sprint.name);

  // MODULE 1: Frontend Development
  const frontendTickets = [
    {
      title: "Setup Next.js project structure",
      description: "Initialize Next.js 14 with App Router, TypeScript, Tailwind CSS, and shadcn/ui components",
      status: TaskStatus.done,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[0].id, // Sarah
    },
    {
      title: "Design product catalog page",
      description: "Create responsive product listing with filters, sorting, and pagination",
      status: TaskStatus.done,
      priority: TaskPriority.high,

      assigneeId: teamMembers[0].id, // Sarah
    },
    {
      title: "Implement shopping cart UI",
      description: "Build cart sidebar with add/remove items, quantity controls, and price calculation",
      status: TaskStatus.review,
      priority: TaskPriority.high,

      assigneeId: teamMembers[5].id, // David
    },
    {
      title: "Create checkout flow",
      description: "Multi-step checkout with shipping, payment, and order confirmation",
      status: TaskStatus.progress,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[0].id, // Sarah
    },
  ];

  // MODULE 2: Backend Development
  const backendTickets = [
    {
      title: "Setup Prisma with PostgreSQL",
      description: "Configure Prisma ORM, design database schema for products, orders, users",
      status: TaskStatus.done,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[6].id, // Lisa
    },
    {
      title: "Build product API endpoints",
      description: "Create REST API for product CRUD operations with filtering and search",
      status: TaskStatus.done,
      priority: TaskPriority.high,

      assigneeId: teamMembers[1].id, // Mike
    },
    {
      title: "Implement order management API",
      description: "Order creation, status updates, and order history endpoints",
      status: TaskStatus.progress,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[1].id, // Mike
    },
    {
      title: "Build inventory management system",
      description: "Real-time stock tracking, low stock alerts, and automatic reordering",
      status: TaskStatus.todo,
      priority: TaskPriority.high,

      assigneeId: teamMembers[1].id, // Mike
    },
  ];

  // MODULE 3: Authentication & Security
  const authTickets = [
    {
      title: "Setup NextAuth.js authentication",
      description: "Configure NextAuth with credentials provider, JWT sessions, and password hashing",
      status: TaskStatus.done,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[5].id, // David
    },
    {
      title: "Implement user registration flow",
      description: "Email validation, password requirements, welcome email",
      status: TaskStatus.review,
      priority: TaskPriority.high,

      assigneeId: teamMembers[5].id, // David
    },
    {
      title: "Add OAuth providers",
      description: "Google and GitHub OAuth integration for social login",
      status: TaskStatus.todo,
      priority: TaskPriority.medium,

      assigneeId: teamMembers[5].id, // David
    },
  ];

  // MODULE 4: UI/UX Design
  const designTickets = [
    {
      title: "Create design system",
      description: "Define color palette, typography, spacing, and component styles",
      status: TaskStatus.done,
      priority: TaskPriority.high,

      assigneeId: teamMembers[2].id, // Emily
    },
    {
      title: "Design mobile-responsive layouts",
      description: "Mobile-first responsive design for all pages",
      status: TaskStatus.review,
      priority: TaskPriority.high,

      assigneeId: teamMembers[2].id, // Emily
    },
    {
      title: "Product detail page redesign",
      description: "Enhanced product images, zoom, reviews section, related products",
      status: TaskStatus.progress,
      priority: TaskPriority.medium,

      assigneeId: teamMembers[2].id, // Emily
    },
  ];

  // MODULE 5: DevOps & Infrastructure
  const devopsTickets = [
    {
      title: "Setup CI/CD pipeline",
      description: "GitHub Actions for automated testing, building, and deployment",
      status: TaskStatus.done,
      priority: TaskPriority.high,

      assigneeId: teamMembers[3].id, // Alex
    },
    {
      title: "Configure Vercel deployment",
      description: "Production and preview deployments, environment variables, domain setup",
      status: TaskStatus.done,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[3].id, // Alex
    },
    {
      title: "Setup monitoring and logging",
      description: "Error tracking with Sentry, performance monitoring, log aggregation",
      status: TaskStatus.todo,
      priority: TaskPriority.medium,

      assigneeId: teamMembers[3].id, // Alex
    },
  ];

  // MODULE 6: QA & Testing
  const qaTickets = [
    {
      title: "Write unit tests for API",
      description: "Test coverage for all backend endpoints using Jest",
      status: TaskStatus.progress,
      priority: TaskPriority.high,

      assigneeId: teamMembers[4].id, // Jessica
    },
    {
      title: "Create E2E test suite",
      description: "Playwright tests for critical user flows: login, browse, checkout",
      status: TaskStatus.todo,
      priority: TaskPriority.high,

      assigneeId: teamMembers[4].id, // Jessica
    },
    {
      title: "Perform security audit",
      description: "XSS, CSRF, SQL injection testing, dependency vulnerability scan",
      status: TaskStatus.todo,
      priority: TaskPriority.critical,

      assigneeId: teamMembers[4].id, // Jessica
    },
  ];

  // MODULE 7: AI Features
  const aiTickets = [
    {
      title: "Build product recommendation engine",
      description: "AI-powered recommendations based on user behavior and purchase history",
      status: TaskStatus.todo,
      priority: TaskPriority.medium,

      assigneeId: teamMembers[1].id, // Mike
    },
    {
      title: "Implement smart search",
      description: "Natural language search with typo tolerance and synonyms",
      status: TaskStatus.todo,
      priority: TaskPriority.medium,

      assigneeId: teamMembers[6].id, // Lisa
    },
  ];

  // Create all tickets
  const allTickets = [
    ...frontendTickets,
    ...backendTickets,
    ...authTickets,
    ...designTickets,
    ...devopsTickets,
    ...qaTickets,
    ...aiTickets,
  ];

  for (const ticketData of allTickets) {
    await prisma.task.create({
      data: {
        sprintId: sprint.id,
        title: ticketData.title,
        description: ticketData.description,
        type: "task",
        status: ticketData.status,
        priority: ticketData.priority,
  
        assigneeId: ticketData.assigneeId,
        createdBy: admin.id,
      },
    });
  }

  console.log(`✅ Created ${allTickets.length} tickets across 7 modules`);
  console.log("\n📊 Ticket Distribution:");
  console.log(`   - Frontend: ${frontendTickets.length} tickets`);
  console.log(`   - Backend: ${backendTickets.length} tickets`);
  console.log(`   - Auth & Security: ${authTickets.length} tickets`);
  console.log(`   - UI/UX Design: ${designTickets.length} tickets`);
  console.log(`   - DevOps: ${devopsTickets.length} tickets`);
  console.log(`   - QA & Testing: ${qaTickets.length} tickets`);
  console.log(`   - AI Features: ${aiTickets.length} tickets`);

  console.log("\n✅ Database seeded successfully!");
  console.log("\n🔐 Login Credentials:");
  console.log("├─ Admin: admin@nexus.com / admin123");
  console.log("├─ Sarah (Frontend): sarah.johnson@nexus.com / member123");
  console.log("├─ Mike (Backend): mike.chen@nexus.com / member123");
  console.log("├─ Emily (Design): emily.davis@nexus.com / member123");
  console.log("├─ Alex (DevOps): alex.kumar@nexus.com / member123");
  console.log("├─ Jessica (QA): jessica.martinez@nexus.com / member123");
  console.log("├─ David (Full Stack): david.brown@nexus.com / member123");
  console.log("└─ Lisa (Database): lisa.wong@nexus.com / member123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
