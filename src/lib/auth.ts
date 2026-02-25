import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { UserModel, UserRole } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "8h" });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  await getDb();
  const user = await UserModel.findById(payload.userId).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role as UserRole,
  };
}

export async function requireAuth() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  return user;
}

