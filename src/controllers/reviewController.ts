import type { Request, Response } from "express";
import { ReviewService } from "../services/reviewService.ts";
import { getValidated } from "../middlewares/validate.ts";
import { getAuthUser } from "../middlewares/auth.ts";
import type { IdParam } from "../schemas/stallSchema.ts";
import type { CreateReviewInput } from "../schemas/reviewSchema.ts";

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  createReview = async (_req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, "params");
    const body = getValidated<CreateReviewInput>(res, "body");
    const review = await this.reviewService.createReview(
      id,
      getAuthUser(res).id,
      body,
    );
    res.status(201).json({ status: "success", data: review });
  };
}
