import { count, eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { reviews, stalls } from '../db/schema.ts';

export interface CreateReviewRecord {
  stallId: number;
  userId: number;
  rating: number;
  comment?: string | null;
}

export class ReviewRepository {
  /**
   * Menyimpan review lalu menghitung ulang avg_rating & review_count warung
   * dalam SATU transaksi, agar data agregat selalu konsisten.
   */
  async create(input: CreateReviewRecord) {
    const db = await getDb();
    return db.transaction(async (tx) => {
      const inserted = await tx
        .insert(reviews)
        .output()
        .values({
          stallId: input.stallId,
          userId: input.userId,
          rating: input.rating,
          comment: input.comment ?? null,
          likeCount: 0,
        });

      // CAST ke DECIMAL: AVG() pada kolom int di SQL Server menghasilkan int.
      const stats = await tx
        .select({
          avg: sql<string>`AVG(CAST(${reviews.rating} AS DECIMAL(5,2)))`,
          total: count(),
        })
        .from(reviews)
        .where(eq(reviews.stallId, input.stallId));

      await tx
        .update(stalls)
        .set({
          avgRating: Number(stats[0]?.avg ?? 0).toFixed(2),
          reviewCount: Number(stats[0]?.total ?? 0),
        })
        .where(eq(stalls.id, input.stallId));

      return inserted[0];
    });
  }
}
