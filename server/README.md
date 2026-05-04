# AI Interviewer Backend

Production-ready backend for AI-powered interviews, featuring asynchronous analysis and adaptive questioning.

## Tech Stack
- **API**: Node.js, Express
- **ORM**: Sequelize (PostgreSQL)
- **Queues**: BullMQ (Redis)
- **AI**: OpenAI GPT-4

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**:
   - Rename `.env.example` to `.env`.
   - Update `DATABASE_URL`, `REDIS_URL`, and `OPENAI_API_KEY`.

3. **Database Migration & Seeding**:
   ```bash
   npm run seed
   ```

4. **Running the System**:
   - **Start API Server**: `npm start`
   - **Start Worker**: `node worker.js`

## API Endpoints

- `POST /api/interviews/start-interview`: Initialize session.
- `GET /api/interviews/next-question`: Fetch next question based on performance.
- `POST /api/interviews/submit-answer`: Submit answer for async evaluation.
- `GET /api/interviews/report`: Generate final summary.
