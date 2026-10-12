import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { adminGuard } from "@/lib/admin-guard"
import { mergeSiteConfig, siteConfig } from "@/lib/site-config"

/**
 * API usada SOMENTE pelo painel de conteúdo.
 * Fonte única: content/site-config.json (sem banco de dados).
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const configFile = path.join(process.cwd(), "content", "site-config.json")
const noStore = { "Cache-Control": "no-store" }

export async function GET() {
  try {
    const raw = await readFile(configFile, "utf8")
    return Response.json(mergeSiteConfig(JSON.parse(raw)), { headers: noStore })
  } catch {
    // Sem arquivo (ou JSON inválido) o painel carrega o conteúdo embutido no bundle.
    return Response.json(siteConfig, { headers: noStore })
  }
}

export async function PUT(request: Request) {
  const blocked = adminGuard(request)
  if (blocked) return blocked

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ message: "JSON inválido." }, { status: 400, headers: noStore })
  }

  const config = mergeSiteConfig(payload)
  try {
    await writeFile(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8")
    return Response.json(config, { headers: noStore })
  } catch {
    return Response.json(
      { message: "Este ambiente não permite gravar arquivos. Baixe o JSON e substitua content/site-config.json." },
      { status: 501, headers: noStore },
    )
  }
}
