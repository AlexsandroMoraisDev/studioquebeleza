import { readFile } from "node:fs/promises"
import path from "node:path"
import { extensionTypes, isSafeUploadName, uploadsDir } from "@/lib/uploads"

/** Serve as fotos gravadas em content/uploads. */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params
  if (!isSafeUploadName(name)) {
    return new Response("Not found", { status: 404 })
  }

  const extension = name.split(".").pop()?.toLowerCase() ?? ""
  const contentType = extensionTypes[extension]
  if (!contentType) {
    return new Response("Not found", { status: 404 })
  }

  try {
    const file = await readFile(path.join(uploadsDir, name))
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
