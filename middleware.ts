import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATH_PREFIXES = ["/share/", "/invite/"];
const PUBLIC_PATHS = ["/", "/login", "/register"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Não mexe em rotas públicas (inclui /share/*)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Protege todas as demais rotas (UI + API) exigindo cookie válido
  const token = req.cookies.get("auth_token")?.value;
  const secretKey = getSecretKey();

  if (!token || !secretKey) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Tudo, exceto assets internos do Next
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

