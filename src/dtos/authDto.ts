export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: "admin" | "owner" | "customer";
}

export interface ReviewResponseDto {
  id: number;
  stallId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: Date | null;
}
