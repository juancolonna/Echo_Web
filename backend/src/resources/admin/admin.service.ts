import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Returns general platform statistics
export async function getAdminStats() {
  const [totalUsers, totalAnalyses, totalTags, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.savedAnalysis.count(),
    prisma.spectrogramTag.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return { totalUsers, totalAnalyses, totalTags, recentUsers };
}

// Returns all users with their analysis count
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      userTypeId: true,
      createdAt: true,
      userType: { select: { label: true } },
      _count: { select: { savedAnalyses: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.userType.label,
    userTypeId: u.userTypeId,
    createdAt: u.createdAt,
    analysisCount: u._count.savedAnalyses,
  }));
}

// Returns all saved analyses across users
export async function getAllAnalyses() {
  const analyses = await prisma.savedAnalysis.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      totalAudios: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      _count: { select: { spectrogramTags: true } },
    },
  });

  return analyses.map((a) => ({
    id: a.id,
    title: a.title,
    totalAudios: a.totalAudios,
    createdAt: a.createdAt,
    userName: a.user.name,
    userEmail: a.user.email,
    tagCount: a._count.spectrogramTags,
  }));
}

// Deletes a user and cascades related data
export async function deleteUser(userId: string, requesterId: string) {
  if (userId === requesterId) {
    throw new Error("Cannot delete yourself");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
}

// Deletes a saved analysis regardless of ownership
export async function deleteAnalysisAdmin(analysisId: string) {
  const analysis = await prisma.savedAnalysis.findUnique({ where: { id: analysisId } });
  if (!analysis) throw new Error("Analysis not found");

  await prisma.savedAnalysis.delete({ where: { id: analysisId } });
  return { success: true };
}