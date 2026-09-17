/** Lado de la foto guardada. El avatar más grande del sistema mide 96 px. */
export const LADO_FOTO = 256

/** Tope del archivo original que se acepta elegir (se achica antes de subir). */
export const MAXIMO_ARCHIVO_MB = 15

/**
 * Recorta la imagen al cuadrado del centro, la achica a `LADO_FOTO` y la
 * devuelve como data URL, en WebP si el navegador lo soporta y si no en JPG.
 * Así lo que viaja al API pesa unos pocos KB aunque la foto original sea de
 * varios MB.
 *
 * `createImageBitmap` respeta la orientación EXIF: las fotos de celular no
 * quedan de costado.
 */
export async function prepararFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith('image/')) {
    throw new Error('Elige una imagen (JPG, PNG o WebP)')
  }
  if (archivo.size > MAXIMO_ARCHIVO_MB * 1024 * 1024) {
    throw new Error(`La imagen pesa más de ${MAXIMO_ARCHIVO_MB} MB`)
  }

  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(archivo)
  } catch {
    throw new Error('No se pudo leer la imagen. Prueba con otra.')
  }

  const lado = Math.min(imagen.width, imagen.height)
  const x = (imagen.width - lado) / 2
  const y = (imagen.height - lado) / 2

  const canvas = document.createElement('canvas')
  canvas.width = LADO_FOTO
  canvas.height = LADO_FOTO
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no puede procesar la imagen')

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imagen, x, y, lado, lado, 0, 0, LADO_FOTO, LADO_FOTO)
  imagen.close()

  const webp = canvas.toDataURL('image/webp', 0.85)
  // Safari viejo no exporta WebP y devuelve PNG en silencio: mejor JPG.
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
}
