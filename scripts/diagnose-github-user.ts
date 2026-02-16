/**
 * GitHub User Diagnostic Script
 *
 * This script checks the database setup for a GitHub user and helps identify
 * why projects may not be showing in the dashboard.
 *
 * Usage:
 *   npx tsx scripts/diagnose-github-user.ts <email>
 *
 * Example:
 *   npx tsx scripts/diagnose-github-user.ts vyshanvi.art@gmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiagnosticResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    githubId: string | null;
    githubUsername: string | null;
    createdAt: Date;
  } | null;
  verticalMemberships: {
    verticalId: string;
    verticalName: string;
    joinedAt: Date;
  }[];
  projectMemberships: {
    projectId: string;
    projectName: string;
    verticalName: string;
    joinedAt: Date;
  }[];
  getUserProjectsResult: {
    id: string;
    name: string;
    verticalName: string;
    sprintCount: number;
    memberCount: number;
  }[];
  analysis: {
    isGitHubUser: boolean;
    hasVerticalMemberships: boolean;
    hasProjectMemberships: boolean;
    totalAccessibleProjects: number;
    issues: string[];
    recommendations: string[];
  };
}

async function diagnoseGitHubUser(email: string): Promise<DiagnosticResult> {
  console.log(`\n🔍 Diagnosing user: ${email}\n`);

  // 1. Get user details
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      githubId: true,
      githubUsername: true,
      createdAt: true,
    },
  });

  if (!user) {
    return {
      user: null,
      verticalMemberships: [],
      projectMemberships: [],
      getUserProjectsResult: [],
      analysis: {
        isGitHubUser: false,
        hasVerticalMemberships: false,
        hasProjectMemberships: false,
        totalAccessibleProjects: 0,
        issues: ['User not found in database'],
        recommendations: [
          'Ensure the user has signed in via GitHub OAuth at least once',
          'Check that the GitHub OAuth callback successfully created the user',
        ],
      },
    };
  }

  console.log('✅ User found in database');

  // 2. Get vertical memberships
  const verticalMemberships = await prisma.verticalUser.findMany({
    where: { userId: user.id },
    include: {
      vertical: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const verticalMembershipsData = verticalMemberships.map((vm) => ({
    verticalId: vm.vertical.id,
    verticalName: vm.vertical.name,
    joinedAt: vm.createdAt,
  }));

  console.log(`📊 Vertical memberships: ${verticalMembershipsData.length}`);

  // 3. Get project memberships
  const projectMemberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          vertical: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const projectMembershipsData = projectMemberships.map((pm) => ({
    projectId: pm.project.id,
    projectName: pm.project.name,
    verticalName: pm.project.vertical.name,
    joinedAt: pm.createdAt,
  }));

  console.log(`📊 Project memberships: ${projectMembershipsData.length}`);

  // 4. Simulate getUserProjects query
  const isAdmin = user.role === 'admin';

  const getUserProjectsResult = await prisma.project.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            {
              vertical: {
                users: {
                  some: { userId: user.id },
                },
              },
            },
            {
              members: {
                some: { userId: user.id },
              },
            },
          ],
        },
    include: {
      vertical: {
        select: { id: true, name: true },
      },
      _count: {
        select: { sprints: true, members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const getUserProjectsData = getUserProjectsResult.map((p) => ({
    id: p.id,
    name: p.name,
    verticalName: p.vertical.name,
    sprintCount: p._count.sprints,
    memberCount: p._count.members,
  }));

  console.log(`📊 getUserProjects result: ${getUserProjectsData.length} projects\n`);

  // 5. Analyze and generate recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  const isGitHubUser = Boolean(user.githubId);
  const hasVerticalMemberships = verticalMembershipsData.length > 0;
  const hasProjectMemberships = projectMembershipsData.length > 0;

  if (!isGitHubUser) {
    issues.push('User does not have GitHub account linked (githubId is null)');
    recommendations.push('User needs to sign in via GitHub OAuth');
  }

  if (!hasVerticalMemberships) {
    issues.push('User is not a member of any verticals');
    recommendations.push(
      'Admin needs to add user to a vertical using the admin panel'
    );
  }

  if (!hasProjectMemberships && !isAdmin) {
    issues.push('User is not a member of any projects');
    recommendations.push(
      'Admin needs to add user to projects, OR',
      'Add user to a vertical (they will see all projects in that vertical)'
    );
  }

  if (getUserProjectsData.length === 0 && !isAdmin) {
    issues.push('getUserProjects returns 0 projects for this user');
    if (hasVerticalMemberships) {
      recommendations.push(
        'Check if projects exist in the verticals this user belongs to',
        'Create projects in the user\'s verticals'
      );
    }
  }

  if (issues.length === 0) {
    if (isAdmin) {
      recommendations.push('User is admin - should see all projects');
    } else {
      recommendations.push(
        `User should see ${getUserProjectsData.length} project(s) in dashboard`
      );
    }
  }

  return {
    user,
    verticalMemberships: verticalMembershipsData,
    projectMemberships: projectMembershipsData,
    getUserProjectsResult: getUserProjectsData,
    analysis: {
      isGitHubUser,
      hasVerticalMemberships,
      hasProjectMemberships,
      totalAccessibleProjects: getUserProjectsData.length,
      issues,
      recommendations,
    },
  };
}

function printDiagnostics(result: DiagnosticResult) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    DIAGNOSTIC REPORT                      ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // User Details
  console.log('👤 USER DETAILS');
  console.log('───────────────────────────────────────────────────────────');
  if (result.user) {
    console.log(`ID:              ${result.user.id}`);
    console.log(`Email:           ${result.user.email}`);
    console.log(`Name:            ${result.user.name || '(not set)'}`);
    console.log(`Role:            ${result.user.role}`);
    console.log(`GitHub ID:       ${result.user.githubId || '❌ NOT LINKED'}`);
    console.log(
      `GitHub Username: ${result.user.githubUsername || '❌ NOT LINKED'}`
    );
    console.log(`Created:         ${result.user.createdAt.toISOString()}`);
  } else {
    console.log('❌ User not found');
  }
  console.log();

  // Vertical Memberships
  console.log('🏢 VERTICAL MEMBERSHIPS');
  console.log('───────────────────────────────────────────────────────────');
  if (result.verticalMemberships.length > 0) {
    result.verticalMemberships.forEach((vm, i) => {
      console.log(`${i + 1}. ${vm.verticalName}`);
      console.log(`   ID: ${vm.verticalId}`);
      console.log(`   Joined: ${vm.joinedAt.toISOString()}`);
    });
  } else {
    console.log('❌ No vertical memberships');
  }
  console.log();

  // Project Memberships
  console.log('📁 PROJECT MEMBERSHIPS (Direct)');
  console.log('───────────────────────────────────────────────────────────');
  if (result.projectMemberships.length > 0) {
    result.projectMemberships.forEach((pm, i) => {
      console.log(`${i + 1}. ${pm.projectName}`);
      console.log(`   Vertical: ${pm.verticalName}`);
      console.log(`   ID: ${pm.projectId}`);
      console.log(`   Joined: ${pm.joinedAt.toISOString()}`);
    });
  } else {
    console.log('⚠️  No direct project memberships');
  }
  console.log();

  // getUserProjects Result
  console.log('🎯 ACCESSIBLE PROJECTS (getUserProjects Result)');
  console.log('───────────────────────────────────────────────────────────');
  if (result.getUserProjectsResult.length > 0) {
    result.getUserProjectsResult.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   Vertical: ${p.verticalName}`);
      console.log(`   ID: ${p.id}`);
      console.log(
        `   Stats: ${p.sprintCount} sprint(s), ${p.memberCount} member(s)`
      );
    });
  } else {
    console.log('❌ No accessible projects (user will see empty dashboard)');
  }
  console.log();

  // Analysis
  console.log('📊 ANALYSIS');
  console.log('───────────────────────────────────────────────────────────');
  console.log(
    `Is GitHub User:              ${result.analysis.isGitHubUser ? '✅ Yes' : '❌ No'}`
  );
  console.log(
    `Has Vertical Memberships:    ${result.analysis.hasVerticalMemberships ? '✅ Yes' : '❌ No'}`
  );
  console.log(
    `Has Project Memberships:     ${result.analysis.hasProjectMemberships ? '✅ Yes' : '⚠️  No (may still access via vertical)'}`
  );
  console.log(
    `Total Accessible Projects:   ${result.analysis.totalAccessibleProjects}`
  );
  console.log();

  // Issues
  if (result.analysis.issues.length > 0) {
    console.log('⚠️  ISSUES FOUND');
    console.log('───────────────────────────────────────────────────────────');
    result.analysis.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    console.log();
  }

  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('───────────────────────────────────────────────────────────');
  result.analysis.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
  console.log();

  console.log('═══════════════════════════════════════════════════════════');
}

// Main execution
async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Email address required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/diagnose-github-user.ts <email>');
    console.log('\nExample:');
    console.log('  npx tsx scripts/diagnose-github-user.ts vyshanvi.art@gmail.com');
    process.exit(1);
  }

  try {
    const result = await diagnoseGitHubUser(email);
    printDiagnostics(result);
  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
