import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const channels = await prisma.channel.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(channels)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { telegramUsername, name, reliability = 5, language = 'ar' } = body

  if (!telegramUsername || !name) {
    return NextResponse.json({ error: 'telegramUsername and name are required' }, { status: 400 })
  }

  const username = telegramUsername.replace(/^@/, '')

  try {
    const channel = await prisma.channel.create({
      data: { telegramUsername: username, name, reliability, language },
    })
    return NextResponse.json(channel, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Channel already exists' }, { status: 409 })
  }
}
