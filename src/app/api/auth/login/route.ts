import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { UserModel } from "@/models/User";
import { signJwt, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    await getDb();
    const json = await request.json();
    const { email, password } = loginSchema.parse(json);

    const user = await UserModel.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signJwt({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          message: "Please check your email and password",
          details: err.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error("Login error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

