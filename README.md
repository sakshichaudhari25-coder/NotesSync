# NoteSync

NoteSync is a collaborative Markdown note app. The backend is built with
Node.js, Express, and MongoDB using Mongoose.

## Backend files

- `backend/server.js` loads environment variables, connects to MongoDB, starts
  Express, and provides the health-check endpoint and error responses.
- `backend/package.json` declares the backend dependencies and the `start` and
  `dev` commands. The project uses ES modules.
- `backend/.env` stores local configuration. `PORT` defaults to `5000`, and
  `MONGODB_URI` points to a local MongoDB database. Do not put database
  passwords or other secrets in source code.
- `backend/models/` is where Mongoose models will go.
- `backend/routes/` is where API route modules will go.

## Run the backend

1. Make sure MongoDB is running locally, or replace `MONGODB_URI` in
   `backend/.env` with your own connection URI.
2. From the `backend` directory, install dependencies with `npm install`.
3. Start with `npm run dev` while developing, or `npm start` for a normal run.
4. Visit `http://localhost:5000/api/health` to check the backend.