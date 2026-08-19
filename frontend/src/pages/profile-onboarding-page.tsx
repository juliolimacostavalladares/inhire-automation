import { BadgeCheck, FileText, LoaderCircle, LockKeyhole, Save, Upload, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfileStore } from '@/features/profile/profile.store'
import type { CandidateProfile } from '@/features/profile/profile.api'

export function ProfileOnboardingPage() {
  const navigate = useNavigate()
  const { profile, loading, error, hydrate, import: importResume, save } = useProfileStore()
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState<Partial<CandidateProfile>>({})
  const [message, setMessage] = useState<string>()

  useEffect(() => { void hydrate() }, [hydrate])
  useEffect(() => {
    if (!profile) return
    setLinkedinProfileUrl(profile.linkedinProfileUrl ?? '')
    setForm(profile)
  }, [profile])

  const skills = useMemo(() => Array.isArray(form.skills) ? form.skills.join(', ') : '', [form.skills])
  const setField = (key: keyof CandidateProfile, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleImport = async () => {
    setMessage(undefined)
    if (!linkedinProfileUrl.trim() || !file) {
      setMessage('Informe o link do LinkedIn e selecione o PDF exportado.')
      return
    }
    try {
      const imported = await importResume({ linkedinProfileUrl: linkedinProfileUrl.trim(), file })
      setForm(imported)
      setMessage('Currículo processado. Revise os dados antes de confirmar.')
    } catch { /* store exposes the error */ }
  }

  const handleSave = async () => {
    setMessage(undefined)
    try {
      await save({
        linkedinProfileUrl,
        phone: form.phone ?? undefined,
        professionalTitle: form.professionalTitle ?? undefined,
        professionalArea: form.professionalArea ?? undefined,
        seniority: form.seniority ?? undefined,
        location: form.location ?? undefined,
        country: form.country ?? undefined,
        salaryExpectation: form.salaryExpectation ?? undefined,
        summary: form.summary ?? undefined,
        alertsEnabled: form.alertsEnabled,
        skills: skills.split(',').map((item) => item.trim()).filter(Boolean),
        workModalities: form.workModalities ?? undefined,
        contractTypes: form.contractTypes ?? undefined,
        experiences: form.experiences ?? undefined,
        education: form.education ?? undefined,
      })
      navigate('/vagas', { replace: true })
    } catch { /* store exposes the error */ }
  }

  const hasExtractedProfile = Boolean(profile && (profile.status === 'NEEDS_REVIEW' || profile.status === 'COMPLETE'))

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-14">
        <p className="text-eyebrow">SEU PERFIL PROFISSIONAL</p>
        <h1 className="mt-3 text-title">Vamos montar seu perfil.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Envie o PDF exportado do seu perfil do LinkedIn. Nós extraímos as informações e você confirma tudo antes de começar.</p>

        <Card className="mt-8 p-5 sm:p-8">
          <div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><BadgeCheck /></div><div><h2 className="font-extrabold">1. Identifique seu perfil</h2><p className="mt-1 text-sm text-muted-foreground">Usaremos o link apenas como referência. Não acessamos seu LinkedIn automaticamente.</p></div></div>
          <div className="mt-6 grid gap-2"><Label htmlFor="linkedin-url">URL do perfil LinkedIn</Label><Input id="linkedin-url" type="url" placeholder="https://www.linkedin.com/in/seu-nome" value={linkedinProfileUrl} onChange={(event) => setLinkedinProfileUrl(event.target.value)} startIcon={<BadgeCheck />} /></div>
        </Card>

        <Card className="mt-4 p-5 sm:p-8">
          <div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Upload /></div><div><h2 className="font-extrabold">2. Envie seu currículo do LinkedIn</h2><p className="mt-1 text-sm text-muted-foreground">No LinkedIn, abra seu perfil → Mais → Salvar como PDF. Aceitamos apenas PDF de até 10 MB.</p></div></div>
          <label htmlFor="resume-file" className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-9 text-center transition hover:border-primary hover:bg-accent/50"><FileText className="size-8 text-primary" /><span className="mt-3 font-extrabold">{file?.name ?? 'Selecionar arquivo PDF'}</span><span className="mt-1 text-xs text-muted-foreground">Clique para escolher o arquivo</span><input id="resume-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
          <Button className="mt-5 w-full sm:w-auto" onClick={() => void handleImport()} disabled={loading}>{loading && <LoaderCircle className="animate-spin" />} {loading ? 'Processando currículo…' : 'Processar meu currículo'}</Button>
        </Card>

        {hasExtractedProfile && <Card className="mt-4 p-5 sm:p-8"><div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><UserRound /></div><div><h2 className="font-extrabold">3. Revise seus dados</h2><p className="mt-1 text-sm text-muted-foreground">A extração é uma sugestão. Ajuste o que precisar antes de confirmar.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="profile-title">Cargo ou objetivo</Label><Input id="profile-title" value={form.professionalTitle ?? ''} onChange={(event) => setField('professionalTitle', event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="profile-area">Área profissional</Label><Input id="profile-area" value={form.professionalArea ?? ''} onChange={(event) => setField('professionalArea', event.target.value)} placeholder="Ex.: Produto, Finanças, Design" /></div><div className="grid gap-2"><Label htmlFor="profile-seniority">Senioridade</Label><Input id="profile-seniority" value={form.seniority ?? ''} onChange={(event) => setField('seniority', event.target.value)} placeholder="Ex.: Pleno" /></div><div className="grid gap-2"><Label htmlFor="profile-location">Localização</Label><Input id="profile-location" value={form.location ?? ''} onChange={(event) => setField('location', event.target.value)} placeholder="Cidade, estado, país" /></div><div className="grid gap-2 sm:col-span-2"><Label htmlFor="profile-skills">Competências</Label><Input id="profile-skills" value={skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value.split(',').map((item) => item.trim()) }))} placeholder="Separe por vírgulas" /></div><div className="grid gap-2 sm:col-span-2"><Label htmlFor="profile-summary">Resumo profissional</Label><textarea id="profile-summary" className="min-h-32 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" value={form.summary ?? ''} onChange={(event) => setField('summary', event.target.value)} /></div></div><Button className="mt-6 w-full sm:w-auto" onClick={() => void handleSave()} disabled={loading}><Save /> Confirmar perfil</Button></Card>}

        {(error || message) && <p className={`mt-4 rounded-lg p-3 text-sm ${error ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-foreground'}`} role={error ? 'alert' : 'status'}>{error ?? message}</p>}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /> Seu PDF é processado com segurança e o arquivo original não é mantido após a confirmação.</p>
      </main>
    </div>
  )
}
