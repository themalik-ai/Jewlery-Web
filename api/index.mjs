/**
 * Vercel Function entrypoint.
 *
 * Vercel imports the Express application instead of opening a long-running
 * listener. vercel.json forwards /api/* and /uploads/* here while preserving
 * the original request URL for Express routing.
 */
import app from '../server/app.mjs'

export default app
