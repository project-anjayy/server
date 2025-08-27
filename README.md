# Server (Backend)

Node.js/Express backend for the Sports Event Platform.

## Tech Stack
- Node.js + Express
- PostgreSQL
- Socket.IO
- JWT Authentication
- bcryptjs
- OpenAI API

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## Project Structure

```
src/
├── config/         # Database and app configuration
├── controllers/    # Request handlers
├── middlewares/    # Express middlewares
├── models/         # Database models
├── routes/         # API routes
└── services/       # Business logic services
migrations/         # Database migrations
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## Development

```bash
npm install
npm run dev
```

The server will be available at http://localhost:3001
