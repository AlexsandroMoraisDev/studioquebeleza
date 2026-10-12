import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { adminGuard } from "@/lib/admin-guard"
import { MAX_UPLOAD_BYTES, imageExtensions, safeFileName, uploadsDir } from "@/lib/uploads"

/** Recebe fotos do painel e grava em content/uploads. */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const noStore = { "Cache-Control": "no-store" }

export async function POST(request: Request) {
  const blocked = adminGuard(request)
  if (blocked) return blocked

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ message: "Envio inválido." }, { status: 400, headers: noStore })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return Response.json({ message: "Selecione um arquivo de imagem." }, { status: 400, headers: noStore })
  }

  const extension = imageExtensions[file.type]
  if (!extension) {
    return Response.json(
      { message: "Formato não aceito. Envie JPG, PNG, WEBP, GIF ou AVIF." },
      { status: 415, headers: noStore },
    )
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ message: "A imagem passa de 8 MB. Reduza o tamanho e tente novamente." }, { status: 413, headers: noStore })
  }

  const filename = safeFileName(file.name, extension)
  try {
    await mkdir(uploadsDir, { recursive: true })
    const bytes = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadsDir, filename), bytes)
    return Response.json({ url: `/api/uploads/${filename}`, bytes: bytes.length }, { headers: noStore })
  } catch {
    return Response.json(
      { message: "Este ambiente não permite gravar arquivos. Use uma imagem por URL no campo da foto." },
      { status: 501, headers: noStore },
    )
  }
}
