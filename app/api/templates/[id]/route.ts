import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';

// GET template by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template with ID "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to fetch template',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH update template (name, description, configuration)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, configuration } = body;

    const existingTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template with ID "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(configuration !== undefined && { configuration: configuration as any }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to update template',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE template (and clean up associated file)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Template with ID "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Delete database template
    await prisma.template.delete({
      where: { id },
    });

    // Delete PDF file from storage
    await storageService.deleteFile(template.originalFileUrl);

    return NextResponse.json({
      success: true,
      data: { id, message: 'Template successfully deleted.' },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'Failed to delete template',
        },
      },
      { status: 500 }
    );
  }
}
