import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy catch-all hacia el backend NestJS (crud-ts-nest-be).
 *
 * Reenvia cualquier peticion `/api/*` al backend conservando el mismo nombre de
 * ruta: `/api/brands` -> `${BACKEND_API_URL}/brands`,
 * `/api/products/query` -> `${BACKEND_API_URL}/products/query`, etc.
 *
 * Ventajas frente a llamar al backend desde el navegador:
 *  - La URL real del backend vive solo en el servidor (no lleva NEXT_PUBLIC),
 *    asi que nunca se expone al cliente.
 *  - No hace falta configurar CORS en el backend: el navegador solo habla con
 *    el mismo origen de Next.
 */

const BACKEND_URL = (
  process.env.BACKEND_API_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

// Cabeceras gestionadas por el propio transporte: no se reenvian tal cual.
const REQUEST_STRIP = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
]);

// En la respuesta, ademas, `fetch` ya descomprime el cuerpo: reenviar
// `content-encoding`/`content-length` originales corromperia la respuesta.
const RESPONSE_STRIP = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
]);

async function proxy(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${path.join('/')}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!REQUEST_STRIP.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // Los datos son dinamicos: el proxy nunca cachea.
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      {
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'No se pudo contactar al backend.',
      },
      { status: 502 },
    );
  }

  // 204/304 no llevan cuerpo (p. ej. el DELETE de productos).
  const noBody = upstream.status === 204 || upstream.status === 304;
  const responseBody = noBody ? null : await upstream.arrayBuffer();

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!RESPONSE_STRIP.has(key.toLowerCase())) responseHeaders.set(key, value);
  });

  return new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
