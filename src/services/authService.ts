import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/userRepository.ts";
import type { UserResponseDto } from "../dtos/authDto.ts";
import type { LoginInput, RegisterInput } from "../schemas/authSchema.ts";
import { ConflictError } from "../errors/ConflictError.ts";
import { UnauthorizedError } from "../errors/UnauthorizedError.ts";
import { signToken } from "../utils/jwt.ts";

const BCRYPT_COST = 10;

type UserRow = NonNullable<Awaited<ReturnType<UserRepository["findById"]>>>;

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  // Mapping row DB -> DTO: passwordHash TIDAK pernah keluar ke client.
  private toDto(row: UserRow): UserResponseDto {
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  }

  async register(input: RegisterInput): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("Email sudah terdaftar");

    // Password di-hash sebelum masuk database. Role register selalu customer.
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const row = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "customer",
    });
    if (!row) throw new Error("Gagal membuat user");
    return this.toDto(row);
  }

  async login(
    input: LoginInput,
  ): Promise<{ token: string; user: UserResponseDto }> {
    const row = await this.userRepository.findByEmail(input.email);
    const valid = row
      ? await bcrypt.compare(input.password, row.passwordHash)
      : false;
    // Pesan sama untuk email salah / password salah (tidak membocorkan akun).
    if (!row || !valid) throw new UnauthorizedError("Email atau password salah");

    const token = signToken({ id: row.id, role: row.role });
    return { token, user: this.toDto(row) };
  }

  async me(userId: number): Promise<UserResponseDto> {
    const row = await this.userRepository.findById(userId);
    if (!row) throw new UnauthorizedError("Akun tidak ditemukan");
    return this.toDto(row);
  }
}
