import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = path.join("/");
  const url = `${BACKEND_URL}/${pathString}${request.nextUrl.search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const headers = new Headers(request.headers);
  // Remove host header to avoid conflicts
  headers.delete("host");
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const body = request.method !== "GET" && request.method !== "HEAD" 
      ? await request.blob() 
      : undefined;

    const response = await fetch(url, {
      method: request.method,
      headers: headers,
      body: body,
      // @ts-ignore - duplex is required for streaming bodies in some fetch implementations
      duplex: body ? 'half' : undefined,
    });

    const data = await response.blob();
    
    // Create new headers for the response
    const responseHeaders = new Headers(response.headers);
    // Remove headers that might cause issues when proxied
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ detail: "Backend proxy error" }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
