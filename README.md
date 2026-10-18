# NCAS

The Laravel API lives in this folder. The React site lives in `frontend/`. A Laravel host should use this repository as the application and serve the `public` directory.

## Local

API and site together:

```sh
npm run dev
```

API only, from this folder:

```sh
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Site only:

```sh
npm --prefix frontend install
npm --prefix frontend run dev
```

The site calls `http://127.0.0.1:8000` unless `frontend` has `VITE_API_URL` set.

Seeded passwords are `demo1234` for `admin@ovs.demo`, `encoder@ovs.demo`, `viewer@ovs.demo`, and `citizen@ovs.demo`.

## Laravel hosting

Point the domain's document root at `public`. Do not point it at this folder. `public/index.php` is the front controller.

```sh
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
```

Set `APP_URL` to the API origin. Add the live site origin to `CORS_ALLOWED_ORIGINS`. On the site host, set `VITE_API_URL` to that same API origin and build `frontend` separately. This API does not serve the React app.
