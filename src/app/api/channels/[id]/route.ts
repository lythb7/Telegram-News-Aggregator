import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json()

  const channel = await prisma.channel.findUnique({ where: { id: parseInt(id) } })
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.channel.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.name        !== undefined && { name:        body.name }),
      ...(body.reliability !== undefined && { reliability: body.reliability }),
      ...(body.isActive    !== undefined && { isActive:    body.isActive }),
      ...(body.language    !== undefined && { language:    body.language }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const channel = await prisma.channel.findUnique({ where: { id: parseInt(id) } })
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.channel.delete({ where: { id: parseInt(id) } })
  return new NextResponse(null, { status: 204 })
}
