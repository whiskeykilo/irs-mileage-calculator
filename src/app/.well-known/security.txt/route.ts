import { NextRequest, NextResponse } from "next/server";

const BODY = [
  "Contact: https://github.com/whiskeykilo/irs-mileage-calculator/security",
  "Expires: 2026-12-31T23:59:59.000Z",
  "",
].join("\n");

/**
 * RFC 9116 security.txt at /.well-known/security.txt.
 * Browsers get minimal HTML with readable styling; others get text/plain.
 */
export function GET(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const wantsHtml = accept.includes("text/html");

  if (wantsHtml) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>security.txt</title>
  <style>
    body { margin: 1rem; font-family: system-ui, sans-serif; background: #fff; color: #1a1a1a; }
    pre { white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
<pre>${escapeHtml(BODY)}</pre>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new NextResponse(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
