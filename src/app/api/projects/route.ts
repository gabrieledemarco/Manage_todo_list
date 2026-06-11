import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        children: {
          include: {
            categories: {
              include: {
                activities: {
                  include: { tasks: true }
                }
              }
            },
            children: true
          }
        },
        categories: {
          include: {
            activities: {
              include: { tasks: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, color, parentId, docPath } = body

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color,
        docPath: docPath || null,
        ...(parentId ? { parentId } : {})
      }
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
