import { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  const status = typeof err.status === 'number' ? err.status : 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({ error: message })
}
