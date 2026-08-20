import { useState, useEffect } from 'react'
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileText,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  generateJobTailoredResume,
  getJobTailoredResume,
  downloadJobTailoredResumePdf,
  type TailoredResume,
} from './jobs.api'
import { useAuthStore } from '@/features/auth/auth.store'
import { getApiErrorMessage } from '@/lib/api/http'
import { Link } from 'react-router-dom'

interface TailoredResumeCardProps {
  jobId: string
  jobTitle: string
}

export function TailoredResumeCard({ jobId, jobTitle }: TailoredResumeCardProps) {
  const { user } = useAuthStore()
  const [resume, setResume] = useState<TailoredResume | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!user || !jobId) return
    let active = true

    async function loadResume() {
      try {
        const data = await getJobTailoredResume(jobId)
        if (active && data) {
          setResume(data)
        }
      } catch {
        // Sem currículo gerado ainda
      }
    }

    void loadResume()
    return () => {
      active = false
    }
  }, [jobId, user])

  const handleGenerate = async (forceRegenerate = false) => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const data = await generateJobTailoredResume(jobId, { forceRegenerate })
      setResume(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao gerar o currículo personalizado.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!resume) return
    setDownloading(true)
    try {
      const url = await downloadJobTailoredResumePdf(jobId)
      const a = document.createElement('a')
      a.href = url
      a.download = `curriculo_${jobTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_ats.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erro ao baixar o arquivo PDF.'))
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyMarkdown = async () => {
    if (!resume?.markdownContent) return
    try {
      await navigator.clipboard.writeText(resume.markdownContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Falha silenciosa
    }
  }

  if (!user) {
    return (
      <Card className="relative overflow-hidden border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="size-4" />
          <span>Otimizador de Currículo ATS com IA</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Faça login para gerar um currículo personalizado com 100% de aderência aos requisitos e filtros desta vaga.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/login">Entrar para Gerar Currículo</Link>
        </Button>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="size-4" />
          <span>Currículo Sob Medida (ATS)</span>
        </div>
        {resume?.matchScore && (
          <Badge variant="default" className="bg-primary text-primary-foreground font-bold">
            <Zap className="mr-1 size-3.5 fill-current" />
            {resume.matchScore}% Match ATS
          </Badge>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!resume ? (
        <div className="mt-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            A IA analisará seu histórico profissional real e alinhará suas competências e feitos aos requisitos desta vaga, gerando um currículo Markdown e PDF formatado para leitura automatizada (ATS).
          </p>
          <Button
            onClick={() => void handleGenerate(false)}
            disabled={loading}
            className="mt-4 w-full"
            size="sm"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Criando Currículo Otimizado...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Gerar Currículo para Esta Vaga
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {resume.summary && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md border border-border/40">
              <strong className="text-foreground">Estratégia ATS:</strong> {resume.summary}
            </p>
          )}

          {resume.highlightedKeywords && resume.highlightedKeywords.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Palavras-chave Alinhadas</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {resume.highlightedKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-[11px] py-0.5 px-2">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => void handleDownloadPdf()}
              disabled={downloading}
              className="w-full"
            >
              {downloading ? (
                <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 size-3.5" />
              )}
              Baixar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleCopyMarkdown()}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 size-3.5 text-primary" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 size-3.5" />
                  Copiar MD
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <FileText className="size-3.5" />
              {showPreview ? 'Ocultar prévia' : 'Ver prévia do currículo'}
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate(true)}
              disabled={loading}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
            >
              <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
              Regerar
            </button>
          </div>

          {showPreview && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-border bg-canvas p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {resume.markdownContent}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
