import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.ts";
import { NotFoundError } from "../errors/NotFoundError.ts";
import { ValidationError } from "../errors/ValidationError.ts";

/**
 * Mengambil kode error SQL Server dari sebuah error.
 * Sebagian versi Drizzle membungkus error driver (mis. `DrizzleQueryError`),
 * sehingga `number` berada di `cause`, bukan di level atas.
 */
function getSqlErrorNumber(error: unknown): number | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return undefined;
    const code = (current as { number?: unknown }).number;
    if (typeof code === "number") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/**
 * Error handling terpusat: satu tempat untuk mengubah error menjadi
 * respons JSON yang konsisten. Didaftarkan paling akhir (setelah router).
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // 1) Body JSON yang rusak (express.json otomatis melempar SyntaxError).
  const bodyError = error as SyntaxError & { status?: number; type?: string };
  if (
    error instanceof SyntaxError &&
    bodyError.status === 400 &&
    bodyError.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      status: "fail",
      message: "JSON pada body tidak valid",
    });
    return;
  }

  // 2) Error aplikasi yang disengaja (NotFoundException, ValidationError, dll).
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof AppError
  ) {
    res.status(error.statusCode).json({
      status: "fail",
      message: error.message,
      ...(error.details !== undefined ? { errors: error.details } : {}),
    });
    return;
  }

  // 3) Konflik constraint database mssql:
  //    2627 = unique violation, 547 = foreign key violation.
  //    Kode error ditelusuri lewat rantai `cause` karena sebagian versi Drizzle
  //    membungkus error driver sehingga `number` tidak ada di level atas.
  const sqlNumber = getSqlErrorNumber(error);
  if (sqlNumber === 2627 || sqlNumber === 547) {
    res.status(409).json({
      status: "fail",
      message: "Data bentrok dengan data yang sudah ada",
    });
    return;
  }

  // 4) Fallback: error tak terduga. Detail tidak dibocorkan ke client.
  console.error("Unhandled error:", error);
  res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan pada server",
  });
};
