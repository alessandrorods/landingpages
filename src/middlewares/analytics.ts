export function analyticsMiddleware(headers: Headers): void {
  headers.set('x-skip-analytics', '1')
}
