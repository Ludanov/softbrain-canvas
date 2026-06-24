import { NextRequest, NextResponse } from 'next/server';

// Canvas Creator API
// Handles canvas creation, export, and layer management

interface CanvasCreateRequest {
  operation: 'create' | 'export' | 'layer';
  width?: number;
  height?: number;
  backgroundColor?: string;
  name?: string;
  canvasData?: string; // JSON string of canvas state
  format?: 'png' | 'jpeg' | 'svg' | 'pdf';
  quality?: number;
  layerOperation?: 'add' | 'remove' | 'reorder' | 'duplicate';
  layerId?: string;
  layerData?: object;
  newIndex?: number;
}

interface CanvasResponse {
  success: boolean;
  data?: object;
  error?: string;
}

// Create a new canvas
function createCanvas(width: number, height: number, backgroundColor: string = '#ffffff', name: string = 'Untitled Canvas') {
  return {
    id: `canvas-${Date.now()}`,
    width,
    height,
    backgroundColor,
    name,
    layers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Process canvas export (validation - actual export is client-side)
function processExport(canvasData: string, format: string, quality: number = 0.9) {
  try {
    const parsed = JSON.parse(canvasData);
    return {
      valid: true,
      format,
      quality,
      canvasInfo: {
        width: parsed.width,
        height: parsed.height,
        layerCount: parsed.layers?.length || 0,
      },
    };
  } catch {
    return { valid: false, error: 'Invalid canvas data' };
  }
}

// Process layer operations
function processLayerOperation(
  canvasData: string,
  operation: string,
  layerId?: string,
  layerData?: object,
  newIndex?: number
) {
  try {
    const parsed = JSON.parse(canvasData);
    const layers = parsed.layers || [];

    switch (operation) {
      case 'add':
        const newLayer = {
          id: `layer-${Date.now()}`,
          ...layerData,
          createdAt: new Date().toISOString(),
        };
        layers.push(newLayer);
        return { success: true, layers, newLayerId: newLayer.id };

      case 'remove':
        const filteredLayers = layers.filter((l: { id: string }) => l.id !== layerId);
        return { success: true, layers: filteredLayers };

      case 'duplicate':
        const layerToDuplicate = layers.find((l: { id: string }) => l.id === layerId);
        if (layerToDuplicate) {
          const duplicatedLayer = {
            ...layerToDuplicate,
            id: `layer-${Date.now()}`,
            name: `${layerToDuplicate.name || 'Layer'} (copy)`,
          };
          const index = layers.findIndex((l: { id: string }) => l.id === layerId);
          layers.splice(index + 1, 0, duplicatedLayer);
          return { success: true, layers, newLayerId: duplicatedLayer.id };
        }
        return { success: false, error: 'Layer not found' };

      case 'reorder':
        if (typeof newIndex === 'number' && layerId) {
          const currentIndex = layers.findIndex((l: { id: string }) => l.id === layerId);
          if (currentIndex !== -1) {
            const [layer] = layers.splice(currentIndex, 1);
            layers.splice(newIndex, 0, layer);
            return { success: true, layers };
          }
        }
        return { success: false, error: 'Invalid reorder parameters' };

      default:
        return { success: false, error: 'Unknown operation' };
    }
  } catch {
    return { success: false, error: 'Invalid canvas data' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CanvasCreateRequest = await request.json();

    // Validate operation
    if (!body.operation) {
      return NextResponse.json(
        { success: false, error: 'Operation is required (create, export, or layer)' } as CanvasResponse,
        { status: 400 }
      );
    }

    switch (body.operation) {
      case 'create':
        // Validate dimensions
        if (!body.width || !body.height) {
          return NextResponse.json(
            { success: false, error: 'Width and height are required for canvas creation' } as CanvasResponse,
            { status: 400 }
          );
        }

        if (body.width < 1 || body.width > 10000 || body.height < 1 || body.height > 10000) {
          return NextResponse.json(
            { success: false, error: 'Dimensions must be between 1 and 10000 pixels' } as CanvasResponse,
            { status: 400 }
          );
        }

        const canvas = createCanvas(body.width, body.height, body.backgroundColor, body.name);
        return NextResponse.json({ success: true, data: canvas } as CanvasResponse, { status: 200 });

      case 'export':
        if (!body.canvasData) {
          return NextResponse.json(
            { success: false, error: 'Canvas data is required for export' } as CanvasResponse,
            { status: 400 }
          );
        }

        if (!body.format || !['png', 'jpeg', 'svg', 'pdf'].includes(body.format)) {
          return NextResponse.json(
            { success: false, error: 'Valid format is required (png, jpeg, svg, or pdf)' } as CanvasResponse,
            { status: 400 }
          );
        }

        const exportResult = processExport(body.canvasData, body.format, body.quality);
        if (!exportResult.valid) {
          return NextResponse.json(
            { success: false, error: exportResult.error } as CanvasResponse,
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            message: 'Canvas validated for export',
            ...exportResult,
            note: 'Actual export is performed client-side using canvas API',
          },
        } as CanvasResponse, { status: 200 });

      case 'layer':
        if (!body.canvasData) {
          return NextResponse.json(
            { success: false, error: 'Canvas data is required for layer operations' } as CanvasResponse,
            { status: 400 }
          );
        }

        if (!body.layerOperation) {
          return NextResponse.json(
            { success: false, error: 'Layer operation is required (add, remove, reorder, or duplicate)' } as CanvasResponse,
            { status: 400 }
          );
        }

        const layerResult = processLayerOperation(
          body.canvasData,
          body.layerOperation,
          body.layerId,
          body.layerData,
          body.newIndex
        );

        if (!layerResult.success) {
          return NextResponse.json(
            { success: false, error: layerResult.error } as CanvasResponse,
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            layers: layerResult.layers,
            newLayerId: layerResult.newLayerId,
            message: `Layer ${body.layerOperation} operation successful`,
          },
        } as CanvasResponse, { status: 200 });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown operation' } as CanvasResponse,
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Canvas API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' } as CanvasResponse,
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    name: 'Canvas Creator API',
    version: '1.0.0',
    description: 'Create, export, and manage canvas documents',
    endpoint: '/api/tools/canvas',
    method: 'POST',
    operations: {
      create: {
        description: 'Create a new canvas',
        required: ['operation', 'width', 'height'],
        optional: ['backgroundColor', 'name'],
        defaults: { backgroundColor: '#ffffff', name: 'Untitled Canvas' },
      },
      export: {
        description: 'Validate canvas data for export',
        required: ['operation', 'canvasData', 'format'],
        optional: ['quality'],
        formats: ['png', 'jpeg', 'svg', 'pdf'],
      },
      layer: {
        description: 'Manage canvas layers',
        required: ['operation', 'canvasData', 'layerOperation'],
        optional: ['layerId', 'layerData', 'newIndex'],
        layerOperations: ['add', 'remove', 'reorder', 'duplicate'],
      },
    },
    limits: {
      maxDimension: 10000,
      minDimension: 1,
    },
    examples: {
      create: {
        operation: 'create',
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
        name: 'My Canvas',
      },
      export: {
        operation: 'export',
        canvasData: '{"width": 800, "height": 600, "layers": []}',
        format: 'png',
        quality: 0.9,
      },
      layer: {
        operation: 'layer',
        canvasData: '{"layers": [{"id": "layer-1", "name": "Background"}]}',
        layerOperation: 'add',
        layerData: { name: 'New Layer', type: 'image' },
      },
    },
  });
}