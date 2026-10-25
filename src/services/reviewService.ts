import { ReviewRepository } from "../repositories/reviewRepository.ts";
import { StallRepository } from "../repositories/stallRepository.ts";
import type { ReviewResponseDto } from "../dtos/authDto.ts";
import type { CreateReviewInput } from "../schemas/reviewSchema.ts";
import { NotFoundError } from "../errors/NotFoundError.ts";

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
  }

  async createReview(
    stallId: number,
    userId: number,
    input: CreateReviewInput,
  ): Promise<ReviewResponseDto> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw new NotFoundError("Warung tidak ditemukan");

    const row = await this.reviewRepository.create({
      stallId,
      userId, // dari token, bukan dari body
      rating: input.rating,
      comment: input.comment ?? null,
    });
    if (!row) throw new Error("Gagal menyimpan review");

    return {
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
    };
  }
}
