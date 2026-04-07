import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
  console.warn('⚠️ Google OAuth credentials are not configured. Google Calendar sync will not work.');
}

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // OAuth URL endpoint
  app.get('/api/auth/google/url', (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: 'Google OAuth credentials not configured',
        details: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in the environment variables.'
      });
    }

    // Hardcoded redirect URI for debugging redirect_uri_mismatch
    const redirectUri = 'https://ais-dev-3nz3zzqoxmeyfazdxs37gg-400880103283.asia-east1.run.app/auth/google/callback';
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      redirect_uri: redirectUri,
      prompt: 'consent'
    });
    res.json({ url });
  });

  // OAuth Callback endpoint
  app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
    const { code } = req.query;
    const redirectUri = 'https://ais-dev-3nz3zzqoxmeyfazdxs37gg-400880103283.asia-east1.run.app/auth/google/callback';

    try {
      const { tokens } = await oauth2Client.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });

      // Store tokens in cookies (SameSite=None, Secure=true for iframe)
      res.cookie('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: (tokens.expiry_date || 3600 * 1000) - Date.now()
      });

      if (tokens.refresh_token) {
        res.cookie('google_refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Google Calendar connected successfully. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Fetch Google Calendar Events
  app.get('/api/calendar/google/events', async (req, res) => {
    const accessToken = req.cookies.google_access_token;
    const isDemo = req.query.demo === 'true';

    if (isDemo) {
      // Return mock data for demo
      return res.json({
        items: [
          {
            id: 'demo-1',
            summary: '🚀 프로젝트 킥오프 미팅',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
            description: '새로운 프로젝트 시작을 위한 팀 미팅입니다.',
            location: '회의실 A',
            htmlLink: 'https://calendar.google.com'
          },
          {
            id: 'demo-2',
            summary: '🍱 팀 점심 식사',
            start: { date: new Date().toISOString().split('T')[0] },
            end: { date: new Date().toISOString().split('T')[0] },
            description: '맛있는 점심 시간!',
            location: '근처 맛집',
            htmlLink: 'https://calendar.google.com'
          },
          {
            id: 'demo-3',
            summary: '💡 아이디어 브레인스토밍',
            start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
            end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
            description: '창의적인 아이디어를 공유하는 시간입니다.',
            location: '온라인 미팅',
            htmlLink: 'https://calendar.google.com'
          }
        ]
      });
    }

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Google' });
    }

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events from Google');
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Fetch Google events error:', error);
      res.status(500).json({ error: 'Failed to fetch Google events' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
