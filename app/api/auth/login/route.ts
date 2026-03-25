import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const correctPassword = process.env.APP_PASSWORD;

    console.log("[Auth] Login attempt");
    console.log("[Auth] APP_PASSWORD set:", !!correctPassword);

    if (!correctPassword) {
      console.log("[Auth] No APP_PASSWORD configured in environment");
      return NextResponse.json(
        { success: false, error: "서버에 비밀번호가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (password !== correctPassword) {
      console.log("[Auth] Wrong password");
      return NextResponse.json(
        { success: false, error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    console.log("[Auth] Password correct, setting cookie");

    const response = NextResponse.json({ success: true });

    response.cookies.set("auth_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth] Error:", error);
    return NextResponse.json(
      { success: false, error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
