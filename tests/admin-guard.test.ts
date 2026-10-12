import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { adminGuard } from "@/lib/admin-guard"

const ENDPOINT = "https://buscavidagarden.com.br/api/site-config"

function request(headers: Record<string, string> = {}) {
  return new Request(ENDPOINT, { method: "PUT", headers })
}

describe("adminGuard", () => {
  const original = process.env.ADMIN_KEY

  beforeEach(() => {
    delete process.env.ADMIN_KEY
  })
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_KEY
    else process.env.ADMIN_KEY = original
  })

  it("libera requisição da mesma origem", () => {
    expect(adminGuard(request({ origin: "https://buscavidagarden.com.br" }))).toBeNull()
  })

  it("libera requisição sem cabeçalho Origin (mesmo host)", () => {
    expect(adminGuard(request())).toBeNull()
  })

  it("bloqueia origem externa com 403 (proteção CSRF)", async () => {
    const blocked = adminGuard(request({ origin: "https://invasor.example" }))
    expect(blocked?.status).toBe(403)
    expect(await blocked!.json()).toMatchObject({ message: "Origem não autorizada." })
  })

  it("bloqueia Origin inválida com 403", () => {
    expect(adminGuard(request({ origin: "não é uma url" }))?.status).toBe(403)
  })

  it("não exige chave quando ADMIN_KEY não está definida", () => {
    expect(adminGuard(request({ origin: "https://buscavidagarden.com.br" }))).toBeNull()
  })

  describe("com ADMIN_KEY definida", () => {
    beforeEach(() => {
      process.env.ADMIN_KEY = "segredo-forte"
    })

    it("exige o cabeçalho x-admin-key (401 sem ele)", async () => {
      const blocked = adminGuard(request({ origin: "https://buscavidagarden.com.br" }))
      expect(blocked?.status).toBe(401)
      expect(await blocked!.json()).toMatchObject({ message: "Chave de acesso inválida." })
    })

    it("recusa chave errada com 401", () => {
      const blocked = adminGuard(request({ origin: "https://buscavidagarden.com.br", "x-admin-key": "errada" }))
      expect(blocked?.status).toBe(401)
    })

    it("aceita a chave correta", () => {
      expect(adminGuard(request({ origin: "https://buscavidagarden.com.br", "x-admin-key": "segredo-forte" }))).toBeNull()
    })

    it("checa a origem antes da chave", () => {
      expect(adminGuard(request({ origin: "https://invasor.example", "x-admin-key": "segredo-forte" }))?.status).toBe(403)
    })
  })
})
