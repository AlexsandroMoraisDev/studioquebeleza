/**
 * Proteção das APIs usadas apenas pelo painel de conteúdo.
 *
 * - Origem: recusa requisições de outro domínio (proteção contra CSRF).
 * - Chave: se ADMIN_KEY estiver definida no ambiente, exige o cabeçalho
 *   `x-admin-key` com o mesmo valor.
 *
 * Retorna uma Response de erro quando bloqueado, ou null quando liberado.
 */
const noStore = { "Cache-Control": "no-store" }

export function adminGuard(request: Request): Response | null {
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return Response.json({ message: "Origem não autorizada." }, { status: 403, headers: noStore })
      }
    } catch {
      return Response.json({ message: "Origem inválida." }, { status: 403, headers: noStore })
    }
  }

  const requiredKey = process.env.ADMIN_KEY
  if (requiredKey && request.headers.get("x-admin-key") !== requiredKey) {
    return Response.json({ message: "Chave de acesso inválida." }, { status: 401, headers: noStore })
  }

  return null
}
