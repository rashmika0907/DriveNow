# Car Rental Site

Express + EJS demo for a car rental landing and browse experience with a simple REST API.

## Running locally

```bash
npm install
npm run dev
# or
npm start
```

Then open `http://localhost:3000`.

## Routes

- `GET /` – home page
- `GET /browse` – car browsing UI
- `GET /api/cars` – list cars with filters and pagination  
  Query params: `make`, `model`, `year`, `seats`, `transmission`, `fuel`, `minPrice`, `maxPrice`, `page`, `pageSize`
- `GET /api/cars/:id` – single car detail

## Data

Mock inventory in `data/cars.json` with fields: `id`, `make`, `model`, `year`, `pricePerDay`, `image`, `seats`, `transmission`, `fuel`.

