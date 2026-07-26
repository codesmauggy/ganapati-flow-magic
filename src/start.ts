import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  // Client-only SPA: no route is server-rendered. Every page mounts and fetches
  // in the browser against the Django REST API, so the server only ships the
  // HTML shell + JS bundle (no per-request React rendering, no data on the server).
  defaultSsr: false,
  requestMiddleware: [errorMiddleware],
}));

