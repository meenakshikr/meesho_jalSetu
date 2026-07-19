export async function compressImage(file: File, maxDim = 1024, quality = 0.7): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  let w = bitmap.width
  let h = bitmap.height
  if (w > h && w > maxDim) {
    h = Math.round((h * maxDim) / w)
    w = maxDim
  } else if (h > maxDim) {
    w = Math.round((w * maxDim) / h)
    h = maxDim
  }

  canvas.width = w
  canvas.height = h
  ctx.drawImage(bitmap, 0, 0, w, h)

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality)
  )
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}
