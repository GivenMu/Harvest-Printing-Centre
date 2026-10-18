# Harvest Printing Centre Website

Website for **Harvest Printing Centre**: services, portfolio, online booking, contact form and an admin dashboard.

Live site: https://harvest-printing-centre.vercel.app

## What it does
- **Services and Portfolio** pages load their content from Firestore (`services`, `portfolio`). If the database is unreachable the built-in HTML is shown instead.
- **Book Online** validates the input, saves a document in `bookings`, and emails the owner (Web3Forms).
- **Contact** validates the input, saves a document in `contacts`, and emails the owner (Web3Forms).
- **Admin dashboard** (`admin-bookings.html`): sign in with an authorised Google account (Firebase Authentication), view bookings and enquiries, and download bookings as a PDF.

## Technologies
HTML5, CSS3, JavaScript (ES modules), Firebase (Firestore and Authentication), Web3Forms, jsPDF, GitHub, Vercel.

## Files
| File | Purpose |
|---|---|
| `index.html`, `services.html`, `portfolio.html`, `booking.html`, `contact.html` | Public pages |
| `admin-bookings.html`, `admin.js` | Admin dashboard and its Google sign-in |
| `firebase-init.js` | Firebase setup shared by every page |
| `forms.js` | Booking and contact forms |
| `services-data.js`, `portfolio-data.js` | Load services and portfolio from Firestore |
| `script.js`, `style.css` | Menu, animations and styling |
| `images/` | Pictures (lowercase names with hyphens, no spaces) |

The database files (rules, seed script, data dictionary) are in the repository's `database/` folder.

## Setup for a developer
1. In the Firebase console enable **Authentication > Sign-in method > Google** and add `harvest-printing-centre.vercel.app` (and `localhost`) under **Authentication > Settings > Authorized domains**.
2. Publish `database/firestore.rules` under **Firestore > Rules**.
3. Seed the data: `cd database && npm install && node seed.js` (see the top of `seed.js`).
4. Admin Google emails are listed in `ADMIN_EMAILS` in `admin.js` and in `isAdmin()` in `firestore.rules`. Keep the two lists identical.
5. Open `index.html` with a local server (for example `npx serve website`). ES modules do not run from `file://`.

Never commit `serviceAccountKey.json` or any `.env` file.

## API (mobile app backend)
The Android app talks to a REST API in the `api/` folder (Node.js, Express, Firebase Admin, Firestore).

- Live API: https://harvest-printing-api.onrender.com (free tier: the first request after idle time can take 30-60 seconds)
- Public: `GET /services`, `GET /services/:id`
- Needs login (`Authorization: Bearer <Firebase ID token>`): `GET/POST /bookings`, `PUT/DELETE /bookings/:id`, `GET/POST /orders`
- Tests: `cd api && npm install && npm test` (also run by GitHub Actions on every push)
- Local run: copy `api/.env.example` to `api/.env`, add the Firebase service account, then `npm start`
- Hosting: Render, root directory `api`, environment variables `FIREBASE_SERVICE_ACCOUNT` and `NODE_VERSION=20`
- Sample orders: `cd database && node seed-orders.js`
