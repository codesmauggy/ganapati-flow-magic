"""
Django SPA fallback for the Manish Kala Kendra frontend.

Drop this file into your Django project (next to `settings.py`) and wire the
catch-all at the very END of the root `urls.py`. It serves the prerendered
`index.html` shell for every non-API, non-static path so client-side routes
(`/stock`, `/customers/12`, `/admin`, deep links, hard refreshes) all work.

Prereqs
-------
1. Build the frontend:            bun run build:spa
2. Copy `dist/spa` into Django:   cp -r dist/spa <django>/frontend/
3. settings.py:

    import os
    FRONTEND_DIR = BASE_DIR / "frontend"          # contains index.html + assets/

    TEMPLATES = [{
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [FRONTEND_DIR],                    # so index.html is findable
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": [...]},
    }]

    STATIC_URL = "/static/"
    STATICFILES_DIRS = [FRONTEND_DIR]              # serves /assets/* and /favicon.ico
    STATIC_ROOT = BASE_DIR / "staticfiles"         # collectstatic target

    # WhiteNoise serves the hashed assets in production (pip install whitenoise)
    MIDDLEWARE = [
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        *MIDDLEWARE_REST,
    ]
    WHITENOISE_ROOT = FRONTEND_DIR                 # <-- makes /assets/* resolve at the ROOT
    WHITENOISE_INDEX_FILE = False
    STORAGES = {
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
    }

Asset paths
-----------
The bundle is built with root-absolute asset URLs (`/assets/...`), which is why
`WHITENOISE_ROOT` (or the nginx `location /assets/` block below) points at the
frontend dir. If you would rather serve assets under `/static/`, rebuild with:

    SPA_BASE=/static/ bun run build:spa

and every emitted URL — including lazily-loaded route chunks — becomes
`/static/assets/...`. Never hand-edit the built HTML; rebuild with SPA_BASE.
"""

from __future__ import annotations

from django.http import HttpRequest, HttpResponse
from django.urls import re_path
from django.views.generic import TemplateView

# Paths that must NEVER fall through to the SPA shell.
API_PREFIXES = ("api/", "static/", "media/", "assets/", "django-admin/")


class SpaFallbackView(TemplateView):
    """Serves the prerendered SPA shell for any client-side route."""

    template_name = "index.html"

    def render_to_response(self, context, **kwargs) -> HttpResponse:
        response = super().render_to_response(context, **kwargs)
        # The shell is tiny and changes on every deploy; assets are hashed and
        # cached forever by WhiteNoise, so only the shell needs revalidation.
        response["Cache-Control"] = "no-cache, must-revalidate"
        return response


def spa_fallback(request: HttpRequest) -> HttpResponse:
    return SpaFallbackView.as_view()(request)


# Add LAST in the root urlpatterns:
#
#   from django.urls import include, path
#   from .spa import spa_urlpatterns
#
#   urlpatterns = [
#       path("django-admin/", admin.site.urls),
#       path("api/", include("erp.api.urls")),
#       *spa_urlpatterns,          # keep last — it matches everything else
#   ]
spa_urlpatterns = [
    re_path(r"^(?!(%s)).*$" % "|".join(API_PREFIXES), SpaFallbackView.as_view(), name="spa"),
]
