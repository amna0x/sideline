import { ZodError } from 'zod'

export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body ?? {})
      if (query) req.query = query.parse(req.query ?? {})
      if (params) req.params = params.parse(req.params ?? {})
      next()
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: 'invalid_input',
          issues: e.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
        })
      }
      next(e)
    }
  }
}
