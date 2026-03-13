import { PrismaClient } from "@prisma/client";
import { CreateArticleDto, UpdateArticleDto } from "./article.types";

const prisma = new PrismaClient();

export async function createArticle(data: CreateArticleDto) {
  return prisma.article.create({
    data: {
      authorId: data.authorId,
      analysisId: data.analysisId || null,
      title: data.title,
      content: data.content,
    },
  });
}

export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      savedAnalysis: { select: { id: true, title: true, jobId: true } },
    },
  });
}

export async function updateArticle(id: string, data: UpdateArticleDto) {
  return prisma.article.update({
    where: { id },
    data,
  });
}

export async function deleteArticle(id: string) {
  return prisma.article.delete({ where: { id } });
}

// Returns all published articles, newest first
export async function getPublishedArticles() {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      savedAnalysis: { select: { id: true, title: true } },
    },
  });
}

// Returns all articles owned by the user, including drafts
export async function getUserArticles(userId: string) {
  return prisma.article.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      savedAnalysis: { select: { id: true, title: true } },
    },
  });
}

// Returns the article linked to a specific analysis for the given author
export async function getArticleByAnalysisId(analysisId: string, authorId: string) {
  return prisma.article.findFirst({
    where: { analysisId, authorId },
  });
}