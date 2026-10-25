import { AppError } from "./AppError.ts";

/** Belum login / token tidak ada, tidak valid, atau kedaluwarsa. Memetakan ke HTTP 401. */
export class UnauthorizedError extends AppError {
  constructor(message = "Autentikasi diperlukan") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}
