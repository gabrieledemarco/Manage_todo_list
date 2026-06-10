import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; prereqId: string }> }
) {
  try {
    const { id, prereqId } = await params

    await prisma.activityDependency.deleteMany({
      where: {
        activityId: id,
        prerequisiteId: prereqId
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete dependency' }, { status: 500 })
  }
}
