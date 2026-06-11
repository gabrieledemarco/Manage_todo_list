import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            activities: {
              include: {
                tasks: {
                  include: {
                    dependsOn: {
                      include: {
                        prerequisite: { select: { id: true, title: true, completed: true } }
                      }
                    }
                  },
                  orderBy: [{ sequenceOrder: 'asc' }, { createdAt: 'asc' }]
                },
                dependsOn: {
                  include: {
                    prerequisite: {
                      select: { id: true, name: true, status: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, color, parentId, docPath } = body

    if (parentId === id) {
      return NextResponse.json({ error: 'A project cannot be its own parent' }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: { name, description, color, parentId: parentId ?? null, docPath: docPath ?? null }
    })
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
