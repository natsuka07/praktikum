import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const emailField = z
  .string({ required_error: "email wajib diisi" })
  .trim()
  .toLowerCase()
  .email("format email tidak valid");

// POST /auth/register — role TIDAK bisa dikirim dari body (selalu customer).
export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "name wajib diisi" })
      .trim()
      .min(3, "name minimal 3 karakter")
      .max(100, "name maksimal 100 karakter")
      .openapi({ example: "Budi Santoso" }),
    email: emailField
      .max(150, "email maksimal 150 karakter")
      .openapi({ example: "budi@student.test" }),
    password: z
      .string({ required_error: "password wajib diisi" })
      .min(8, "password minimal 8 karakter")
      .max(72, "password maksimal 72 karakter")
      .openapi({ example: "Password123" }),
  })
  .strict();

// POST /auth/login
export const loginSchema = z
  .object({
    email: emailField.openapi({ example: "admin@kantin.test" }),
    password: z
      .string({ required_error: "password wajib diisi" })
      .min(1, "password wajib diisi")
      .openapi({ example: "Password123" }),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
