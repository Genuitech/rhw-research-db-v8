/**
 * API Key Authentication Middleware
 * Validates incoming requests from data-ingestion scripts
 */

export async function validateApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        message: 'Include Authorization: Bearer {API_KEY} header'
      });
    }

    const apiKey = authHeader.substring(7);
    const validKey = process.env.INGEST_API_KEY;

    if (!validKey) {
      console.error('[Auth] INGEST_API_KEY not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'INGEST_API_KEY not set'
      });
    }

    if (apiKey !== validKey) {
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    // Store in request for logging
    req.apiKey = apiKey;
    req.isDataIngestion = true;

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
}

/**
 * Optional: Entra SSO middleware (for staff/admin users)
 * Used for other endpoints that require authenticated users
 */
export async function validateEntraToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);

    // In production, verify token against Azure AD
    // For now, basic validation
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // This would call Azure AD to validate the token
    // For development, we'll do a simple check
    const decoded = decodeToken(token);

    if (!decoded || !decoded.upn) {
      return res.status(401).json({ error: 'Invalid token structure' });
    }

    req.user = {
      email: decoded.upn,
      name: decoded.name,
      id: decoded.sub,
      isAdmin: decoded.upn === process.env.ADMIN_EMAIL
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

function decodeToken(token) {
  try {
    // Simple JWT decode (does NOT verify signature in development)
    // In production, use jsonwebtoken library to verify
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return decoded;
  } catch (error) {
    return null;
  }
}
