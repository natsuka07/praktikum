import { AppError } from "./AppError.ts";

/** Data bentrok dengan data yang sudah ada (mis. email terdaftar). HTTP 409. */
export class ConflictError extends AppError {
  constructor(message = "Data bentrok dengan data yang sudah ada") {
    super(409, message);
    this.name = "ConflictError";
  }
}
