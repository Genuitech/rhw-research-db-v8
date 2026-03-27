/**
 * Azure Function: healthCheck
 * GET /api/health
 *
 * Simple health check endpoint for monitoring and uptime checks
 * No authentication required
 */

export async function healthCheck(req, context) {
  try {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0',
        uptime: process.uptime()
      })
    }
  } catch (error) {
    context.log.error(`Health check error: ${error.message}`)

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    }
  }
}

export default healthCheck
