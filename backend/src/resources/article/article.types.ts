export interface CreateArticleDto {
  authorId: string;
  analysisId?: string;
  title: string;
  content: string;
}

export interface UpdateArticleDto {
  title?: string;
  content?: string;
  published?: boolean;
}
