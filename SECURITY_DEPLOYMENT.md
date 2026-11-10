# Authentication security deployment notes

This branch hardens the Django + SimpleJWT authentication flow. Apply the deployment steps below before deploying it.

## Required environment variables

Set these in the hosting provider's secret/configuration panel. Do not commit a real `.env` file.

- `DJANGO_SECRET_KEY`: generate a new random Django secret key. The previous key was hard-coded in the public repository and must be considered compromised.
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS`: comma-separated hostnames, without schemes or paths.
- `CORS_ALLOWED_ORIGINS`: comma-separated exact browser origins (include scheme, e.g. `https://safa27.darkube.ir`). If the frontend and API are same-origin, this can be empty.
- Database variables: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.

Changing `DJANGO_SECRET_KEY` invalidates JWTs signed with the old key. Users will need to sign in again. This is intentional because the old key was exposed.

## Database migration

The blacklist app is now enabled. Run:

```bash
python manage.py migrate
```

This creates the SimpleJWT outstanding/blacklisted token tables. Do this before enabling the new logout and refresh-rotation flow.

## Validation commands

Run these in the backend environment:

```bash
python manage.py check
python manage.py check --deploy
python manage.py test core
```

The test suite includes login, inactive-account rejection, logout revocation, and refresh-token rotation.

## Operational notes

- Access tokens now last 15 minutes; refresh tokens last 7 days and rotate on use.
- Logout blacklists the presented refresh token. Password changes blacklist outstanding refresh tokens for that user.
- Run `python manage.py flushexpiredtokens` periodically (for example, daily) to remove expired token records.
- Serve the site only over HTTPS. Configure HTTPS at the hosting platform/reverse proxy.
- Configure the exact frontend origin in `CORS_ALLOWED_ORIGINS` if frontend and API use different origins.
- Browser tokens are still stored in `localStorage` for compatibility with the current frontend. This remains exposed to same-origin JavaScript and XSS; a future migration to Secure, HttpOnly, SameSite cookies with CSRF protection is recommended.
- Review the hosting platform's proxy and static/media serving configuration separately. Django's development static/media serving is not a substitute for a production web server or object storage.
