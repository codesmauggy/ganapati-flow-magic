# Deploying the ERP frontend behind Django

The frontend builds to a plain static bundle: an `index.html` shell plus hashed
JS/CSS. Django serves the assets and falls back to the shell for every
client-side route. No Node process runs in production.

## 1. Build the static bundle

```bash
bun install
bun run build:spa            # → dist/spa/
```

Output:

```text
dist/spa/
  index.html      SPA fallback shell (also copied to 200.html)
  assets/         hashed JS + CSS (immutable, safe to cache forever)
  favicon.ico  robots.txt  llms.txt
```

Set the API base URL at build time (it is inlined into the bundle):

```bash
VITE_API_BASE_URL=https://erp.example.com bun run build:spa
```

## 2. Production asset paths

Assets are emitted as root-absolute URLs (`/assets/index-*.js`). Two supported
layouts:

| Layout | Build command | Django/nginx serves |
| --- | --- | --- |
| Assets at root (default) | `bun run build:spa` | `/assets/*` from `dist/spa` |
| Assets under `/static/` | `SPA_BASE=/static/ bun run build:spa` | `/static/assets/*` |

`SPA_BASE` rewrites **every** URL, including lazily-loaded route chunks and the
CSS/font references, because it is applied as Vite's `base` at build time. Never
hand-edit paths in the built `index.html` — rebuild instead.

## 3. Wire up Django

Copy the bundle and add the fallback route:

```bash
cp -r dist/spa/. /srv/erp/frontend/
```

`deploy/django/spa.py` in this repo is a drop-in module containing
`SpaFallbackView` / `spa_urlpatterns` plus the exact `settings.py` snippets
(templates dir, `STATICFILES_DIRS`, WhiteNoise `WHITENOISE_ROOT`).

```python
# urls.py — the SPA catch-all MUST be last
urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/", include("erp.api.urls")),
    *spa_urlpatterns,
]
```

The regex excludes `api/`, `static/`, `media/`, `assets/`, and `django-admin/`,
so API 404s stay JSON 404s instead of returning HTML.

## 4. nginx (recommended in front of gunicorn)

```nginx
server {
    listen 443 ssl;
    server_name erp.example.com;

    root /srv/erp/frontend;

    # Hashed assets — immutable
    location /assets/ {
        access_log off;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location = /favicon.ico { try_files $uri =404; }
    location = /robots.txt  { try_files $uri =404; }

    # Django API + admin
    location ~ ^/(api|django-admin|static|media)/ {
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://127.0.0.1:8000;
    }

    # SPA fallback — every other path returns the shell
    location / {
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri /index.html;
    }
}
```

If nginx handles the fallback, the Django catch-all is still worth keeping as a
safety net for direct gunicorn access.

## 5. Checklist after each deploy

- `curl -I https://erp.example.com/customers/1` → `200` and `text/html`
- `curl -I https://erp.example.com/assets/<hashed>.js` → `200`, `Cache-Control: immutable`
- `curl -i https://erp.example.com/api/does-not-exist` → JSON 404, not HTML
- Hard-refresh a deep route in the browser; console must be error-free
- CORS is unnecessary when Django and the bundle share an origin; otherwise add
  the frontend origin to `CORS_ALLOWED_ORIGINS`

Note: the `bun run build` (default) target is used by Lovable hosting and is
unaffected by any of the above — `build:spa` is the self-hosted path.
