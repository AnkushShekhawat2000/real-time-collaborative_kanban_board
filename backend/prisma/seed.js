import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@12345", 12);

  const organization = await prisma.organization.create({
    data: {
      name: "ABC Technologies",
      slug: "abc-technologies",
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: "Delhi Branch",
      slug: "delhi-branch",
      organizationId: organization.id,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: hashedPassword,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      tenantId: null,
      role: "ORG_ADMIN",
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      tenantId: tenant.id,
      role: "TENANT_ADMIN",
    },
  });

  console.log("Organization created:", organization.name);
  console.log("Tenant created:", tenant.name);
  console.log("Admin created:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
