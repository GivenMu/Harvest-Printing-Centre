# Harvest Printing Centre

Website, REST API and database for **Harvest Printing Centre**: services, portfolio, online booking, contact form, an admin dashboard and the backend for the Android app.

[![CI](https://github.com/GivenMu/Harvest-Printing-Centre/actions/workflows/ci.yml/badge.svg)](https://github.com/GivenMu/Harvest-Printing-Centre/actions)

## Live links

| What | Link |
|---|---|
| Website | https://harvest-printing-centre.vercel.app |
| API (Render) | https://harvest-printing-api.onrender.com |
| Services (public API route) | https://harvest-printing-api.onrender.com/services |
| API test page | https://harvest-printing-centre.vercel.app/token.html |
| Repository | https://github.com/GivenMu/Harvest-Printing-Centre |
| GitHub Actions | https://github.com/GivenMu/Harvest-Printing-Centre/actions |

## How the parts fit together

```
Android app  -->  Express API (Render)  -->  Firestore
Website (Vercel) ------------------------->  Firestore
Firebase Authentication (Google sign-in) protects both; the API verifies the user's token on every protected request.
```

## Website

### What it does
- **Services and Portfolio** pages load their content from Firestore (`services`, `portfolio`). If the database is unreachable the built-in HTML is shown instead.
- **Book Online** validates the input, saves a document in `bookings`, and emails the owner (Web3Forms).
- **Contact** validates the input, saves a document in `contacts`, and emails the owner (Web3Forms).
- **Google sign-in** on the website uses the Firebase web SDK (`signInWithPopup`).
- **Admin dashboard** (`admin-bookings.html`): sign in with an authorised Google account (Firebase Authentication), view bookings and enquiries, and download bookings as a PDF.
- **API test page** (`token.html`): sign in with Google to see your Firebase ID token, copy the token or the full `Authorization` header for Postman, and call the API from the page. It includes a "no token" button that returns `401`, which proves the login protection. Used for testing and report evidence.

### Technologies
HTML5, CSS3, JavaScript (ES modules), Firebase (Firestore and Authentication), Web3Forms, jsPDF, GitHub, Vercel.

### Website files
| File | Purpose |
|---|---|
| `index.html`, `services.html`, `portfolio.html`, `booking.html`, `contact.html` | Public pages |
| `admin-bookings.html`, `admin.js` | Admin dashboard and its Google sign-in |
| `token.html` | API test page that shows a Firebase token and calls the API |
| `firebase-init.js` | Firebase setup shared by every page |
| `forms.js` | Booking and contact forms |
| `services-data.js`, `portfolio-data.js` | Load services and portfolio from Firestore |
| `script.js`, `style.css` | Menu, animations and styling |
| `images/` | Pictures (lowercase names with hyphens, no spaces) |

## API (mobile app backend)

The Android app talks to a REST API in the `api/` folder (Node.js, Express, Firebase Admin, Firestore). The API checks the Firebase ID token with `verifyIdToken` and returns JSON with the status codes 200, 201, 400, 401 and 404.

The live API is hosted on Render's free tier, so the first request after idle time can take 30-60 seconds. Open `GET /` a minute before a demo to wake it.

### Endpoints
| Endpoint | Login needed | What it does |
|---|---|---|
| `GET /` | No | Health check |
| `GET /services` | No | List all services |
| `GET /services/:id` | No | One service, or 404 |
| `POST /bookings` | Yes | Create a booking |
| `GET /bookings` | Yes | List the user's own bookings |
| `PUT /bookings/:id` | Yes | Update one of the user's bookings |
| `DELETE /bookings/:id` | Yes | Delete one of the user's bookings |
| `POST /orders` | Yes | Create an order |
| `GET /orders` | Yes | List the user's orders |

Protected routes need the header `Authorization: Bearer <Firebase ID token>`. Without a valid token they return `401`.

### Request bodies
Order (the server reads prices from `services`; services with no price are flagged `requiresQuote`):

```json
{"items":[{"serviceId":"business-cards","quantity":2}]}
```

Booking (phone = digits only, date = `YYYY-MM-DD`):

```json
{"name":"Thabo","phone":"0821234567","email":"t@test.com","service":"Business Cards","quantity":100,"date":"2026-12-01","message":""}
```

### Security
- Each user can only see and change their own bookings.
- The app sends only service IDs and quantities, never prices.
- All input is validated before it reaches the database.
- The Firebase service-account key and `.env` are never committed.

### Run and test the API
- Tests: `cd api && npm install && npm test`
- Local run: copy `api/.env.example` to `api/.env`, add the Firebase service account on one line, then `npm start` and open http://localhost:3000/services
- Hosting: Render, root directory `api`, build command `npm install`, start command `npm start`, environment variables `FIREBASE_SERVICE_ACCOUNT` and `NODE_VERSION=20` (optional: `MOBILE_FIREBASE_PROJECT_IDS`, default `harvest-printing-centre-a7eb8`, the Android app's Firebase project whose tokens are also accepted)

## Database (Firestore)

The project uses Firestore (approved by the lecturer), so each collection plays the role of a table. Every collection has 10 or more documents.

| Collection | Documents | Purpose |
|---|---|---|
| `services` | 14 | Printing services and prices |
| `portfolio` | 14 | Portfolio items |
| `bookings` | 10 | Customer bookings (bookings made from the app carry a `userId`) |
| `contacts` | 10 | Contact form messages |
| `orders` | 10 | Orders placed through the API: `userId`, `items`, `total`, `requiresQuote`, `status`, `createdAt` |

Seed orders carry `source: "seed"`. The full field list for every collection is in `database/COLLECTIONS.md`. Security rules are in `database/firestore.rules`. Orders are closed to direct client access, so everything goes through the API.

## Automated testing and CI
- 16 Jest and Supertest tests in `api/tests/api.test.js` run against a fake Firestore, so they need no keys or internet.
- They cover public routes, authentication (401), bookings, orders and the validators.
- GitHub Actions (`.github/workflows/ci.yml`) installs the API and runs `npm test` on every push and pull request.
- The Android build job in `ci.yml` is switched on once the app is added to the `app/` folder.

## Setup for a developer
1. In the Firebase console enable **Authentication > Sign-in method > Google** and add `harvest-printing-centre.vercel.app` (and `localhost`) under **Authentication > Settings > Authorized domains**.
2. Publish `database/firestore.rules` under **Firestore > Rules**.
3. Seed the data: `cd database && npm install && node seed.js` (see the top of `seed.js`). Then add the orders with `node seed-orders.js`.
4. Admin Google emails are listed in `ADMIN_EMAILS` in `admin.js` and in `isAdmin()` in `firestore.rules`. Keep the two lists identical.
5. Open `index.html` with a local server (for example `npx serve` from the folder that contains `index.html`). ES modules do not run from `file://`.

Never commit `serviceAccountKey.json`, your Firebase key file or any `.env` file.

## Working as a team
- Everyone works on their own branch (`feature/your-name`) and merges into `main` through a pull request. No zip files and no "upload file" shortcut on GitHub.
- Before new work run `git pull origin main`.
- Tasks are tracked on the Azure DevOps Kanban board.

| Member | Part |
|---|---|
| Mpho Nethomboni | Android app (Kotlin), sign-in, API integration |
| Given Mutshotsho | Backend API, Firestore database build, website, Settings screen, tests and CI |
| Lebogang Ntlatleng | GitHub, README shell, Azure DevOps board, release notes |
| Munei Nevhuthanda | Test plan, Postman tests, bug log, user guide |
| Portia Mashaba | Database design, ERD, data dictionary, demo video |



## Demo video
https://youtu.be/U77z-zHZVnk
