import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary (usar variables de entorno del servidor, no NEXT_PUBLIC_*)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dde0ivoy6",
  api_key: process.env.CLOUDINARY_API_KEY || "934917933919596",
  api_secret: process.env.CLOUDINARY_API_SECRET || "w2aDC0DWbjEt-HDk4GWMxNeqaOg",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Convertir File a Buffer para Cloudinary SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary usando el SDK oficial
    // Usamos Promise para convertir el callback a async/await
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "reportes",
            resource_type: "image",
            // Optimizaciones automáticas recomendadas por Cloudinary
            fetch_format: "auto",
            quality: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error: any) {
    console.error("Error al subir imagen a Cloudinary:", error);
    return NextResponse.json(
      {
        error: "Error al subir la imagen",
        details: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

