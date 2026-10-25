import { AppError } from "./AppError.ts";

/** Sudah login, tetapi tidak punya hak akses. Memetakan ke HTTP 403. */
export class ForbiddenError extends AppError {
  constructor(message = "Anda tidak memiliki akses ke resource ini") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}
