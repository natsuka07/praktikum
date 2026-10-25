import {
  StallRepository,
  type FindAllParams,
} from "../repositories/stallRepository.ts";
import { MenuItemRepository } from "../repositories/menuItemRepository.ts";
import type { MenuItemDto, StallResponseDto } from "../dtos/stallDto.ts";
import { NotFoundError } from "../errors/NotFoundError.ts";
import { ForbiddenError } from "../errors/ForbiddenError.ts";
import type { AuthUser } from "../types/auth.ts";
import type {
  CreateStallInput,
  UpdateStallInput,
} from "../schemas/stallSchema.ts";

type StallRow = NonNullable<Awaited<ReturnType<StallRepository["findById"]>>>;

export class StallService {
  private stallRepository: StallRepository;
  private menuItemRepository: MenuItemRepository;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
  ) {
    this.stallRepository = stallRepository;
    this.menuItemRepository = menuItemRepository;
  }

  // Mapping row DB -> DTO API (sekaligus logika bisnis isPopular).
  private toDto(row: StallRow): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError("Warung tidak ditemukan");
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new NotFoundError("Warung tidak ditemukan");
    return this.menuItemRepository.findByStallId(id);
  }

  // Pemilik warung = user dari token (bukan dari request body).
  async createStall(
    input: CreateStallInput,
    user: AuthUser,
  ): Promise<StallResponseDto> {
    const row = await this.stallRepository.create({
      ...input,
      ownerId: user.id,
    });
    if (!row) throw new NotFoundError("Warung gagal dibuat");
    return this.toDto(row);
  }

  async updateStall(
    id: number,
    input: UpdateStallInput,
    user: AuthUser,
  ): Promise<StallResponseDto> {
    const existing = await this.stallRepository.findById(id);
    if (!existing) throw new NotFoundError("Warung tidak ditemukan");

    // owner hanya boleh mengubah warung miliknya; admin boleh semua.
    if (user.role === "owner" && existing.ownerId !== user.id) {
      throw new ForbiddenError("Anda hanya boleh mengubah warung milik sendiri");
    }

    const row = await this.stallRepository.update(id, input);
    if (!row) throw new NotFoundError("Warung tidak ditemukan");
    return this.toDto(row);
  }

  async deleteStall(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.remove(id);
    if (!row) throw new NotFoundError("Warung tidak ditemukan");
    return this.toDto(row);
  }
}
