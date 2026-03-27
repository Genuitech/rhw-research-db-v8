const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'cromine@rhwcpas.com'

export function validateEntraToken(token) {
  if (!token) {
    return { isValid: false, error: 'No token provided' }
  }

  try {
    if (!token.upn) {
      return { isValid: false, error: 'Invalid token structure' }
    }

    const user = {
      id: token.sub,
      email: token.upn,
      name: token.name,
      isAdmin: token.upn === ADMIN_EMAIL
    }

    return { isValid: true, user }
  } catch (error) {
    return { isValid: false, error: error.message }
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7)
    // In production, verify and decode token using Azure AD
    let decoded
    try {
      // For now, parse as JSON if it's a test token
      decoded = JSON.parse(Buffer.from(token, 'utf8').toString())
    } catch {
      // In production, use jwt.verify() with Azure AD public keys
      decoded = null
    }

    const validation = validateEntraToken(decoded)
    if (!validation.isValid) {
      return res.status(401).json({ error: validation.error })
    }

    req.user = validation.user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err)

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (err.status === 403) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  res.status(500).json({ error: 'Internal server error' })
}
