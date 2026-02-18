# Mutual Aid & Skill-Sharing App

A full-stack CRUD application for mutual aid and skill-sharing with Discord OAuth authentication.

## Tech Stack

- **Backend**: Node.js + Express + MongoDB + Passport.js
- **Frontend**: React + Vite
- **Auth**: Discord OAuth
- **Database**: MongoDB Atlas

## Features

✅ Discord OAuth authentication
✅ Create, read, update, delete requests
✅ Search and filter requests by keyword and tags
✅ Respond to requests
✅ Session-based auth with MongoDB session store
✅ CORS configured for both local and production
✅ Client-side error handling with user-friendly messages
✅ Loading states for async operations

## Project Structure

```
mutual-aid-app/
├── server/          # Express backend
│   ├── src/
│   │   ├── config/      # Passport config
│   │   ├── models/      # Mongoose models (User, Request)
│   │   ├── routes/      # API routes (auth, requests)
│   │   └── index.js     # Server entry
│   └── package.json
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/       # Home, RequestForm, RequestView
│   │   ├── App.jsx      # Main app component
│   │   ├── api.js       # API helper functions
│   │   └── main.jsx     # Entry point
│   └── package.json
└── README.md
```

## Setup

### 1. Backend Setup

```bash
cd server
npm install
```

Create `.env` file:
```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
SESSION_SECRET=your-random-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:4000/auth/discord/callback
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Discord App Setup**:
1. Go to https://discord.com/developers/applications
2. Create a new application
3. Add OAuth2 redirect URI: `http://localhost:4000/auth/discord/callback`
4. Copy Client ID and Client Secret to your `.env`

Start the server:
```bash
npm run dev
```

Server runs on http://localhost:4000

### 2. Frontend Setup

```bash
cd client
npm install
```

Optional: Create `.env` for custom API URL:
```bash
VITE_API_URL=http://localhost:4000
```

Start the client:
```bash
npm run dev
```

Client runs on http://localhost:5173

## API Endpoints

### Auth Routes
- `GET /auth/discord` - Initiate Discord OAuth flow
  - Response: Redirects to Discord login
- `GET /auth/discord/callback` - OAuth callback handler
  - Response: Redirects to frontend on success, to `/auth/failure` on error
- `GET /auth/failure` - Authentication failure handler
  - Response: `401` `{ error: 'Authentication failed' }`
- `GET /auth/me` - Get current user session
  - Response: `{ user: {...} }` or `{ user: null }`
- `GET /auth/logout` - Logout current user
  - Response: Redirects to frontend URL

### Request Routes

#### Public Routes
- `GET /api/requests` - List all requests (supports query params)
  - Query params: `?q=search&tags=tag1,tag2`
  - Response: `200` Array of request objects
  - Error: `500` `{ error: 'error message' }`

- `GET /api/requests/:id` - Get single request with responses
  - Response: `200` Request object with populated author and responses
  - Error: `404` `{ error: 'Not found' }` or `500` `{ error: 'error message' }`

#### Protected Routes (require authentication)
- `POST /api/requests` - Create new request
  - Body: `{ title, description, tags: [] }`
  - Response: `200` Created request object
  - Error: `401` `{ error: 'Unauthorized' }` or `500` `{ error: 'error message' }`

- `PUT /api/requests/:id` - Update request (owner only)
  - Body: `{ title?, description?, tags? }`
  - Response: `200` Updated request object
  - Error: `401` Unauthorized, `403` `{ error: 'Forbidden' }`, `404` Not found, or `500` Server error

- `DELETE /api/requests/:id` - Delete request (owner only)
  - Response: `200` `{ ok: true }`
  - Error: `401` Unauthorized, `403` Forbidden, `404` Not found, or `500` Server error

- `POST /api/requests/:id/respond` - Add response to request
  - Body: `{ message }`
  - Response: `200` Updated request with populated responses
  - Error: `401` Unauthorized, `404` Not found, or `500` Server error

## Client-Side Error Handling

The frontend includes comprehensive error handling:

### Error Display
- All pages display error messages in a red alert box at the top
- Errors are cleared when retrying operations
- Network errors and API errors show user-friendly messages

### Loading States
- Form buttons show "Creating..." or "Sending..." during submission
- Buttons are disabled during async operations to prevent duplicate requests

### Routes
- `GET /` - Home page with request list and search
- `GET /new` - Create new request form (requires login)
- `GET /r/:id` - View request details and responses
- `GET /auth/failure` - Shows friendly error message when Discord auth fails

### Auth Protection
- Protected pages show "Please login to..." messages for unauthenticated users
- Auth failures redirect to `/auth/failure` with clear error message and link to return home

## Production Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables in hosting platform
2. Update `DISCORD_CALLBACK_URL` to production URL
3. Add production redirect URI to Discord app settings
4. Update `FRONTEND_URL` to production frontend URL

### Frontend (Vercel/Netlify)
1. Set `VITE_API_URL` to production backend URL
2. Add production frontend URL to backend's `allowedOrigins` array

## Troubleshooting

**CORS Errors**: Ensure backend's `allowedOrigins` includes your frontend URL

**Session Not Persisting**: 
- Check `FRONTEND_URL` matches your client origin
- For production HTTPS, ensure `NODE_ENV=production`
- Clear browser cookies and try again

**Discord OAuth Error**:
- Verify `DISCORD_CALLBACK_URL` matches exactly one URL in Discord app settings
- No `||` or multiple URLs in the env variable

**MongoDB Connection Error**:
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas Network Access whitelist (add 0.0.0.0/0 or your IP)
- Ensure database user has correct permissions

## License

MIT
