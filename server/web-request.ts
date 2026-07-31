import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

export function toWebRequest(request: ExpressRequest): Request {
  const host = request.get("host");
  if (!host) throw new Error("Host header is required");

  const method = request.method.toUpperCase();
  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: toWebHeaders(request)
  };

  if (method !== "GET" && method !== "HEAD" && Buffer.isBuffer(request.body)) {
    init.body = request.body as unknown as BodyInit;
    init.duplex = "half";
  }

  return new Request(
    new URL(request.originalUrl, `${request.protocol}://${host}`),
    init
  );
}

export async function sendWebResponse(
  response: Response,
  expressResponse: ExpressResponse
): Promise<void> {
  expressResponse.status(response.status);

  response.headers.forEach((value, name) => {
    if (name.toLowerCase() !== "set-cookie") {
      expressResponse.setHeader(name, value);
    }
  });

  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = responseHeaders.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    expressResponse.setHeader("set-cookie", cookies);
  } else {
    const cookie = response.headers.get("set-cookie");
    if (cookie) expressResponse.setHeader("set-cookie", cookie);
  }

  if (response.body === null) {
    expressResponse.end();
    return;
  }
  expressResponse.end(Buffer.from(await response.arrayBuffer()));
}

function toWebHeaders(request: ExpressRequest): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(name, entry);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }
  return headers;
}
