import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Protect /admin with HTTP Basic Auth
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) return NextResponse.next() // skip if not configured

    const auth = req.headers.get('authorization')
    if (auth) {
      const [, b64] = auth.split(' ')
      const [, pass] = Buffer.from(b64, 'base64').toString().split(':')
      if (pass === adminPassword) return NextResponse.next()
    }

    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
