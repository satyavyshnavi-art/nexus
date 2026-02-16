import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@nexus.com' },
    select: {
      name: true,
      email: true,
      githubId: true,
      githubUsername: true,
      githubAccessToken: true,
    }
  });

  console.log('\n=== Admin User GitHub Status ===');
  console.log(`Email: ${admin?.email}`);
  console.log(`Name: ${admin?.name}`);
  console.log(`GitHub ID: ${admin?.githubId || '❌ NOT CONNECTED'}`);
  console.log(`GitHub Username: ${admin?.githubUsername || '❌ NOT SET'}`);
  console.log(`Has GitHub Token: ${admin?.githubAccessToken ? '✅ YES' : '❌ NO'}`);

  if (!admin?.githubAccessToken) {
    console.log('\n⚠️  PROBLEM FOUND:');
    console.log('You need to sign in with GitHub to get an access token!');
    console.log('\nFix:');
    console.log('1. Log out of Nexus');
    console.log('2. Click "Sign in with GitHub" button');
    console.log('3. Authorize the app');
    console.log('4. Then try linking the repository again');
  } else {
    console.log('\n✅ GitHub authentication is set up correctly!');
    console.log('\nYou should be able to link repositories now.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
