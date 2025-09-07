import type { MiddlewareNext, MiddlewareHandler } from 'astro';

// Normalize URLs: remove trailing slash (except root) to avoid 404 when user types /learn/synths/
export const onRequest: MiddlewareHandler = async (context, next: MiddlewareNext) => {
  const url = new URL(context.request.url);
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/$/, '');
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
