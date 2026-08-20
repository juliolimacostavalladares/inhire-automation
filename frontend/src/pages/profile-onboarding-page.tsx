import {
  BadgeCheck,
  Briefcase,
  FileText,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Save,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CandidateTopbar } from '@/components/layout/candidate-topbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfileStore } from '@/features/profile/profile.store'
import type { CandidateProfile, EducationEntry, ExperienceEntry } from '@/features/profile/profile.api'

export function ProfileOnboardingPage() {
  const navigate = useNavigate()
  const { profile, loading, error, hydrate, import: importResume, save } = useProfileStore()
  const [linkedinProfileUrl, setLinkedinProfileUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState<Partial<CandidateProfile>>({})
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([])
  const [message, setMessage] = useState<string>()

  useEffect(() => { void hydrate() }, [hydrate])

  useEffect(() => {
    if (!profile) return
    setLinkedinProfileUrl(profile.linkedinProfileUrl ?? '')
    setForm(profile)
    setExperiences(profile.experiences ?? [])
    setEducation(profile.education ?? [])
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
      setExperiences(imported.experiences ?? [])
      setEducation(imported.education ?? [])
      setMessage('Currículo processado com sucesso! Revise suas experiências, formação e dados antes de confirmar.')
    } catch { /* store exposes the error */ }
  }

  // --- Handlers de Experiência ---
  const updateExperience = (index: number, patch: Partial<ExperienceEntry>) => {
    setExperiences((prev) => prev.map((exp, i) => (i === index ? { ...exp, ...patch } : exp)))
  }

  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        company: '',
        title: '',
        startMonth: null,
        startYear: null,
        endMonth: null,
        endYear: null,
        ongoing: true,
        location: null,
        description: null,
      },
    ])
  }

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Handlers de Educação ---
  const updateEducation = (index: number, patch: Partial<EducationEntry>) => {
    setEducation((prev) => prev.map((edu, i) => (i === index ? { ...edu, ...patch } : edu)))
  }

  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
      {
        school: '',
        degree: null,
        field: null,
        startMonth: null,
        startYear: null,
        endMonth: null,
        endYear: null,
        ongoing: false,
      },
    ])
  }

  const removeEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setMessage(undefined)
    try {
      const updated = await save({
        linkedinProfileUrl: linkedinProfileUrl.trim(),
        phone: form.phone?.trim() || undefined,
        professionalTitle: form.professionalTitle?.trim() || undefined,
        professionalArea: form.professionalArea?.trim() || undefined,
        seniority: form.seniority?.trim() || undefined,
        location: form.location?.trim() || undefined,
        country: form.country?.trim() || undefined,
        salaryExpectation: form.salaryExpectation?.trim() || undefined,
        summary: form.summary?.trim() || undefined,
        alertsEnabled: form.alertsEnabled ?? true,
        skills: skills.split(',').map((item) => item.trim()).filter(Boolean),
        workModalities: form.workModalities ?? undefined,
        contractTypes: form.contractTypes ?? undefined,
        experiences: experiences.filter((exp) => exp.company?.trim() || exp.title?.trim()),
        education: education.filter((edu) => edu.school?.trim()),
      })
      if (updated && updated.status === 'COMPLETE') {
        navigate('/vagas', { replace: true })
      }
    } catch { /* erro gerenciado pela store */ }
  }

  const hasExtractedProfile = Boolean(profile && (profile.status === 'NEEDS_REVIEW' || profile.status === 'COMPLETE'))

  return (
    <div className="min-h-svh bg-canvas">
      <CandidateTopbar />
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-14">
        <p className="text-eyebrow">SEU PERFIL PROFISSIONAL</p>
        <h1 className="mt-3 text-title">Vamos montar seu perfil.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Envie o PDF exportado do seu perfil do LinkedIn. Nós extraímos seu histórico de experiências, formação acadêmica, competências e resumo profissional.
        </p>

        {/* 1. URL do LinkedIn */}
        <Card className="mt-8 p-5 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <BadgeCheck />
            </div>
            <div>
              <h2 className="font-extrabold text-base">1. Identifique seu perfil</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Usaremos o link apenas como referência. Não acessamos seu LinkedIn automaticamente.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-2">
            <Label htmlFor="linkedin-url">URL do perfil LinkedIn</Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://www.linkedin.com/in/seu-nome"
              value={linkedinProfileUrl}
              onChange={(event) => setLinkedinProfileUrl(event.target.value)}
              startIcon={<BadgeCheck />}
            />
          </div>
        </Card>

        {/* 2. Upload do PDF */}
        <Card className="mt-4 p-5 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Upload />
            </div>
            <div>
              <h2 className="font-extrabold text-base">2. Envie seu currículo do LinkedIn</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                No LinkedIn, abra seu perfil → Mais → Salvar como PDF. Aceitamos apenas PDF de até 10 MB.
              </p>
            </div>
          </div>
          <label
            htmlFor="resume-file"
            className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-9 text-center transition hover:border-primary hover:bg-accent/50"
          >
            <FileText className="size-8 text-primary" />
            <span className="mt-3 font-extrabold">{file?.name ?? 'Selecionar arquivo PDF'}</span>
            <span className="mt-1 text-xs text-muted-foreground">Clique para escolher o arquivo</span>
            <input
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button className="mt-5 w-full sm:w-auto" onClick={() => void handleImport()} disabled={loading}>
            {loading && <LoaderCircle className="animate-spin" />} {loading ? 'Processando currículo…' : 'Processar meu currículo'}
          </Button>
        </Card>

        {/* 3. Revisão de Dados Extraídos */}
        {hasExtractedProfile && (
          <div className="mt-6 space-y-6">
            {/* Informações Gerais */}
            <Card className="p-5 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <UserRound />
                </div>
                <div>
                  <h2 className="font-extrabold text-base">3. Dados Pessoais & Resumo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Verifique suas informações de cabeçalho e descrição geral.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="profile-title">Cargo ou objetivo profissional</Label>
                  <Input
                    id="profile-title"
                    value={form.professionalTitle ?? ''}
                    onChange={(event) => setField('professionalTitle', event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-location">Localização</Label>
                  <Input
                    id="profile-location"
                    value={form.location ?? ''}
                    onChange={(event) => setField('location', event.target.value)}
                    placeholder="Cidade, Estado, País"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-phone">Telefone</Label>
                  <Input
                    id="profile-phone"
                    value={form.phone ?? ''}
                    onChange={(event) => setField('phone', event.target.value)}
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-seniority">Senioridade</Label>
                  <Input
                    id="profile-seniority"
                    value={form.seniority ?? ''}
                    onChange={(event) => setField('seniority', event.target.value)}
                    placeholder="Ex.: Sênior, Pleno, Júnior"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="profile-skills">Competências (Top Skills)</Label>
                  <Input
                    id="profile-skills"
                    value={skills}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        skills: event.target.value.split(',').map((item) => item.trim()),
                      }))
                    }
                    placeholder="Separe por vírgulas (Ex: React.js, TailwindCSS, APIs RESTful)"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="profile-summary">Resumo profissional</Label>
                  <textarea
                    id="profile-summary"
                    className="min-h-32 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.summary ?? ''}
                    onChange={(event) => setField('summary', event.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Experiências Profissionais */}
            <Card className="p-5 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Briefcase />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base">Experiências Profissionais</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Histórico profissional extraído do seu currículo.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addExperience} type="button">
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>

              <div className="mt-6 space-y-6">
                {experiences.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhuma experiência extraída ou cadastrada.</p>
                ) : (
                  experiences.map((exp, idx) => (
                    <div key={idx} className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 relative">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Experiência #{idx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                          onClick={() => removeExperience(idx)}
                          type="button"
                          aria-label="Remover experiência"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Empresa</Label>
                          <Input
                            value={exp.company}
                            placeholder="Nome da empresa"
                            onChange={(e) => updateExperience(idx, { company: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Cargo / Título</Label>
                          <Input
                            value={exp.title ?? ''}
                            placeholder="Ex: Engenheiro de Software Senior"
                            onChange={(e) => updateExperience(idx, { title: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Início (Mês / Ano)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={exp.startMonth ?? ''}
                              placeholder="Mês (ex: May)"
                              onChange={(e) => updateExperience(idx, { startMonth: e.target.value || null })}
                            />
                            <Input
                              value={exp.startYear ?? ''}
                              placeholder="Ano (ex: 2023)"
                              onChange={(e) => updateExperience(idx, { startYear: e.target.value || null })}
                            />
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Fim (Mês / Ano)</Label>
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={exp.ongoing}
                                onChange={(e) => updateExperience(idx, { ongoing: e.target.checked })}
                                className="rounded"
                              />
                              Trabalho atual
                            </label>
                          </div>
                          {!exp.ongoing ? (
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={exp.endMonth ?? ''}
                                placeholder="Mês (ex: May)"
                                onChange={(e) => updateExperience(idx, { endMonth: e.target.value || null })}
                              />
                              <Input
                                value={exp.endYear ?? ''}
                                placeholder="Ano (ex: 2025)"
                                onChange={(e) => updateExperience(idx, { endYear: e.target.value || null })}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-xs font-semibold text-muted-foreground">
                              Presente (Em andamento)
                            </div>
                          )}
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                          <Label className="text-xs">Localização</Label>
                          <Input
                            value={exp.location ?? ''}
                            placeholder="Ex: Remoto, Rondon, PR ou São Paulo, SP"
                            onChange={(e) => updateExperience(idx, { location: e.target.value || null })}
                          />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                          <Label className="text-xs">Descrição das atividades / Realizações</Label>
                          <textarea
                            className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={exp.description ?? ''}
                            placeholder="Descreva suas principais realizações e tecnologias..."
                            onChange={(e) => updateExperience(idx, { description: e.target.value || null })}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Formação Acadêmica */}
            <Card className="p-5 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary-foreground">
                    <GraduationCap />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base">Formação Acadêmica & Cursos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Instituições de ensino, graus acadêmicos e cursos técnicos.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addEducation} type="button">
                  <Plus className="size-4" /> Adicionar
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {education.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhuma formação acadêmica extraída ou cadastrada.</p>
                ) : (
                  education.map((edu, idx) => (
                    <div key={idx} className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 relative">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Formação #{idx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                          onClick={() => removeEducation(idx)}
                          type="button"
                          aria-label="Remover formação"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5 sm:col-span-2">
                          <Label className="text-xs">Instituição / Escola</Label>
                          <Input
                            value={edu.school}
                            placeholder="Ex: Firjan SENAI, Universidade de São Paulo"
                            onChange={(e) => updateEducation(idx, { school: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Grau / Formato</Label>
                          <Input
                            value={edu.degree ?? ''}
                            placeholder="Ex: Ensino Médio, Curso, Bacharelado"
                            onChange={(e) => updateEducation(idx, { degree: e.target.value || null })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Área de Estudo / Curso</Label>
                          <Input
                            value={edu.field ?? ''}
                            placeholder="Ex: Tecnologia da Informação, Ciência da Computação"
                            onChange={(e) => updateEducation(idx, { field: e.target.value || null })}
                          />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                          <Label className="text-xs">Período</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Input
                              value={edu.startMonth ?? ''}
                              placeholder="Mês início (ex: Feb)"
                              onChange={(e) => updateEducation(idx, { startMonth: e.target.value || null })}
                            />
                            <Input
                              value={edu.startYear ?? ''}
                              placeholder="Ano início (ex: 2019)"
                              onChange={(e) => updateEducation(idx, { startYear: e.target.value || null })}
                            />
                            <Input
                              value={edu.endMonth ?? ''}
                              placeholder="Mês fim (ex: Dec)"
                              onChange={(e) => updateEducation(idx, { endMonth: e.target.value || null })}
                            />
                            <Input
                              value={edu.endYear ?? ''}
                              placeholder="Ano fim (ex: 2021)"
                              onChange={(e) => updateEducation(idx, { endYear: e.target.value || null })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Button className="w-full sm:w-auto h-11 text-base px-8 font-bold" onClick={() => void handleSave()} disabled={loading}>
              <Save className="size-5" /> Confirmar e Salvar Perfil
            </Button>
          </div>
        )}

        {(error || message) && (
          <p
            className={`mt-4 rounded-lg p-3 text-sm ${
              error ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-foreground'
            }`}
            role={error ? 'alert' : 'status'}
          >
            {error ?? message}
          </p>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" /> Seu PDF é processado com segurança e o arquivo original não é mantido após a confirmação.
        </p>
      </main>
    </div>
  )
}
