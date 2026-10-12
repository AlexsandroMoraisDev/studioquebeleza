"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Copy, Download, ExternalLink, Loader2, RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldEditor } from "@/components/painel/field-editor"
import { applyChange } from "@/components/painel/field-editor"
import { mergeSiteConfig, type SiteConfig } from "@/lib/site-config"
import { panelSections } from "@/lib/panel-sections"
import type { ConfigPath } from "@/lib/config-utils"

type Status = { kind: "idle" | "ok" | "error"; message: string }

export default function PainelPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" })
  const [busy, setBusy] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  // Carrega (e recarrega, quando o token muda) o conteúdo vindo da API.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch("/api/site-config", { cache: "no-store" })
        if (!response.ok) throw new Error("falha ao carregar")
        const data = mergeSiteConfig(await response.json())
        if (!cancelled) setConfig(data)
      } catch {
        if (!cancelled) setStatus({ kind: "error", message: "Não foi possível carregar o conteúdo do site." })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const change = useCallback((path: ConfigPath, value: unknown) => {
    setConfig((current) => (current ? applyChange(current, path, value) : current))
  }, [])

  const json = useMemo(() => (config ? JSON.stringify(config, null, 2) : ""), [config])

  async function save() {
    if (!config) return
    setBusy(true)
    setStatus({ kind: "idle", message: "" })
    try {
      const response = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        cache: "no-store",
      })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? "falha ao salvar")
      setConfig(mergeSiteConfig(result))
      setStatus({ kind: "ok", message: "Conteúdo salvo em content/site-config.json. Recarregue o site para ver." })
    } catch (error) {
      setStatus({
        kind: "error",
        message: `${error instanceof Error ? error.message : "Não foi possível salvar."} — use “Baixar JSON” e substitua o arquivo content/site-config.json.`,
      })
    } finally {
      setBusy(false)
    }
  }

  function download() {
    const blob = new Blob([json], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "site-config.json"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(json)
      setStatus({ kind: "ok", message: "JSON copiado para a área de transferência." })
    } catch {
      setStatus({ kind: "error", message: "Não foi possível copiar. Use “Baixar JSON”." })
    }
  }

  if (!config) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Carregando conteúdo do site...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-24">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-bold">Editor de conteúdo do site</h1>
            <p className="text-xs text-muted-foreground">
              As seções seguem a ordem em que o visitante lê a página. Todo texto é editável, reordenável e removível.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink data-icon="inline-start" /> Ver site
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={() => void copy()} disabled={busy}>
              <Copy data-icon="inline-start" /> Copiar JSON
            </Button>
            <Button size="sm" variant="outline" onClick={download} disabled={busy}>
              <Download data-icon="inline-start" /> Baixar JSON
            </Button>
            <Button size="sm" variant="outline" onClick={() => setReloadToken((token) => token + 1)} disabled={busy}>
              <RotateCcw data-icon="inline-start" /> Descartar alterações
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={busy}>
              {busy ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />} Salvar
            </Button>
          </div>
        </div>
        {status.message ? (
          <div
            role="status"
            className={`mx-auto max-w-7xl px-4 pb-3 text-sm sm:px-6 ${
              status.kind === "error" ? "text-destructive" : "text-primary"
            }`}
          >
            {status.kind === "ok" ? <Check data-icon="inline-start" className="inline size-4" /> : null} {status.message}
          </div>
        ) : null}
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
        <nav aria-label="Seções do site" className="lg:sticky lg:top-28 lg:h-fit lg:w-64 lg:shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Ordem do site</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {panelSections.map((section) => (
              <li key={section.key}>
                <a
                  href={`#sec-${section.key}`}
                  className="inline-block rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex w-full flex-col gap-6">
          {panelSections.map((section) => (
            <Card key={section.key} id={`sec-${section.key}`} className="scroll-mt-28">
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
                <CardDescription>{section.hint}</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldEditor value={config[section.key]} path={[section.key]} onChange={change} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
