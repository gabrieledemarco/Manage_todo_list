import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            project: true
          }
        },
        tasks: true
      }
    })
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    return NextResponse.json(activity)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, status } = body
    
    const activity = await prisma.activity.update({
      where: { id },
      data: { name, description, status }
    })
    return NextResponse.json(activity)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.activity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}