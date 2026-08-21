import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  DollarSign,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Send,
  ExternalLink,
  Loader2,
  Bookmark,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/use-auth'
import { useProfileStore } from '@/features/profile/profile.store'
import {
  getApplicationForm,
  applyToJob,
  getJobTailoredResume,
  type ApplicationFormStructure,
  type TailoredResume,
} from './jobs.api'
import { getApiErrorMessage } from '@/lib/api/http'
import { cn } from '@/lib/utils'

interface ApplicationFormWizardProps {
  jobId: string
  jobTitle: string
  company: string
  jobUrl: string
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

type WizardStep = 1 | 2 | 3 | 4

export function ApplicationFormWizard({
  jobId,
  jobTitle,
  company,
  jobUrl,
  isFavorited = false,
  onToggleFavorite,
}: ApplicationFormWizardProps) {
  const { user } = useAuth()
  const { profile, hydrate } = useProfileStore()

  const [step, setStep] = useState<WizardStep>(1)
  const [formStructure, setFormStructure] = useState<ApplicationFormStructure | null>(null)
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [salaryExpectation, setSalaryExpectation] = useState('')
  const [contractType, setContractType] = useState('CLT')
  const [workModel, setWorkModel] = useState('Remoto')
  const [coverNote, setCoverNote] = useState('')
  const [resumeType, setResumeType] = useState<'TAILORED' | 'PROFILE'>('TAILORED')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(true)

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Step Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 1. Fetch user profile if logged in
  useEffect(() => {
    if (user && !profile) {
      void hydrate()
    }
  }, [user, profile, hydrate])

  // 2. Auto-fill data from user and profile
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '')
      setEmail((prev) => prev || user.email || '')
    }
    if (profile) {
      setPhone((prev) => prev || profile.phone || '')
      setLocation((prev) => prev || profile.location || '')
      setLinkedinUrl((prev) => prev || profile.linkedinProfileUrl || '')
      setSalaryExpectation((prev) => prev || profile.salaryExpectation || '')
      if (profile.contractTypes && profile.contractTypes.length > 0) {
        setContractType(profile.contractTypes[0] || 'CLT')
      }
      if (profile.workModalities && profile.workModalities.length > 0) {
        setWorkModel(profile.workModalities[0] || 'Remoto')
      }
    }
  }, [user, profile])

  // 3. Fetch Job Application Form Structure & Tailored Resume
  useEffect(() => {
    let active = true

    void getApplicationForm(jobId).then((data) => {
      if (active) {
        setFormStructure(data)
      }
    })

    if (user) {
      void getJobTailoredResume(jobId).then((data) => {
        if (active) {
          setTailoredResume(data)
        }
      })
    }

    return () => {
      active = false
    }
  }, [jobId, user])

  // Validation handlers
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Nome completo é obrigatório'
    if (!email.trim() || !email.includes('@')) newErrors.email = 'E-mail válido é obrigatório'
    if (!phone.trim()) newErrors.phone = 'Telefone/WhatsApp é obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    // Validate required diversity questions if any
    if (formStructure?.diversityQuestions) {
      for (const q of formStructure.diversityQuestions) {
        if (q.required && !answers[q.id]?.trim()) {
          newErrors[q.id] = 'Esta pergunta é obrigatória'
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!privacyPolicyAccepted) {
      newErrors.privacy = 'Você precisa aceitar os termos de privacidade para enviar'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    setSubmitError(null)
    if (step === 1) {
      if (validateStep1()) setStep(2)
    } else if (step === 2) {
      if (validateStep2()) setStep(3)
    }
  }

  const handleBack = () => {
    setSubmitError(null)
    setErrors({})
    if (step > 1) setStep((prev) => (prev - 1) as WizardStep)
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        salaryExpectation: salaryExpectation.trim() || undefined,
        contractType: contractType || undefined,
        workModel: workModel || undefined,
        coverNote: coverNote.trim() || undefined,
        resumeType,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
        privacyPolicyAccepted,
      }

      await applyToJob(jobId, payload)
      setStep(4)
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Não foi possível enviar sua candidatura. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    void navigator.clipboard?.writeText(jobUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const stepTitles: Record<WizardStep, string> = {
    1: 'Identificação & Contato',
    2: 'Expectativas & Fit',
    3: 'Currículo & Envio',
    4: 'Candidatura Concluída',
  }

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <Card className="overflow-hidden border border-border/80 bg-card shadow-sm transition-all">
      {/* Wizard Header */}
      <div className="border-b border-border/60 bg-accent/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs shadow-2xs">
              <Briefcase className="size-3.5" />
            </span>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-foreground">
              Candidatura Rápida
            </span>
          </div>

          {step < 4 && (
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-background">
              Passo {step} de 3
            </Badge>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <h3 className="text-sm font-extrabold tracking-tight text-foreground">
            {stepTitles[step]}
          </h3>
          {step < 4 && (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {progressPercent}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="p-4 sm:p-5">
        {submitError && (
          <div role="alert" className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* STEP 1: Dados Pessoais & Contato */}
        {step === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <Label htmlFor="applicant-name" className="text-xs font-bold text-foreground">
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1">
                <Input
                  id="applicant-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Júlio Lima"
                  startIcon={<User className="size-4" />}
                  invalid={Boolean(errors.name)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              {errors.name && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="applicant-email" className="text-xs font-bold text-foreground">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1">
                <Input
                  id="applicant-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  startIcon={<Mail className="size-4" />}
                  invalid={Boolean(errors.email)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              {errors.email && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="applicant-phone" className="text-xs font-bold text-foreground">
                  WhatsApp / Celular <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1">
                  <Input
                    id="applicant-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    startIcon={<Phone className="size-4" />}
                    invalid={Boolean(errors.phone)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="applicant-location" className="text-xs font-bold text-foreground">
                  Cidade / Estado
                </Label>
                <div className="mt-1">
                  <Input
                    id="applicant-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="São Paulo, SP"
                    startIcon={<MapPin className="size-4" />}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="applicant-linkedin" className="text-xs font-bold text-foreground">
                Perfil do LinkedIn
              </Label>
              <div className="mt-1">
                <Input
                  id="applicant-linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/seuperfil"
                  startIcon={<Globe className="size-4" />}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleNext}
              className="mt-2 w-full h-10 rounded-xl font-bold text-xs gap-1.5"
            >
              Próximo passo <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* STEP 2: Perguntas & Fit */}
        {step === 2 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="applicant-salary" className="text-xs font-bold text-foreground">
                  Pretensão Salarial
                </Label>
                <div className="mt-1">
                  <Input
                    id="applicant-salary"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    placeholder="R$ 10.000,00"
                    startIcon={<DollarSign className="size-4" />}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-foreground">
                  Tipo de Contrato
                </Label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25"
                >
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="Estágio">Estágio</option>
                  <option value="Indiferente">Indiferente</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-foreground">
                Modalidade de Trabalho Preferida
              </Label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(['Remoto', 'Híbrido', 'Presencial'] as const).map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setWorkModel(model)}
                    className={cn(
                      'h-8 rounded-lg border text-xs font-bold transition-all text-center',
                      workModel === model
                        ? 'border-primary bg-primary text-primary-foreground font-black shadow-2xs'
                        : 'border-border bg-card text-foreground hover:bg-accent',
                    )}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Diversity Questions from InHire if configured */}
            {formStructure?.diversityQuestions && formStructure.diversityQuestions.length > 0 && (
              <div className="mt-3 space-y-3 rounded-xl border border-border/80 bg-accent/10 p-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Perguntas Adicionais da Vaga
                </p>
                {formStructure.diversityQuestions.map((q) => (
                  <div key={q.id}>
                    <Label className="text-xs font-bold text-foreground">
                      {q.question || q.title}
                      {q.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {q.options && q.options.length > 0 ? (
                      <select
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground outline-none"
                      >
                        <option value="">Selecione uma opção</option>
                        {q.options.map((opt) => (
                          <option key={opt.id} value={opt.title || opt.id}>
                            {opt.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={q.placeholder || 'Sua resposta'}
                        className="mt-1 h-9 text-xs rounded-xl"
                      />
                    )}
                    {errors[q.id] && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors[q.id]}</p>}
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="applicant-note" className="text-xs font-bold text-foreground">
                Mensagem ou Carta de Apresentação (Opcional)
              </Label>
              <textarea
                id="applicant-note"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Conte brevemente por que você tem o perfil ideal para esta vaga..."
                rows={3}
                className="mt-1 w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-10 flex-1 rounded-xl text-xs font-bold gap-1"
              >
                <ArrowLeft className="size-3.5" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="h-10 flex-1 rounded-xl text-xs font-bold gap-1"
              >
                Próximo <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Currículo & Envio */}
        {step === 3 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div>
              <Label className="text-xs font-bold text-foreground">
                Selecione o Currículo a ser enviado
              </Label>
              <div className="mt-2 space-y-2">
                {/* 1. Tailored Resume Option */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setResumeType('TAILORED')}
                  onKeyDown={(e) => e.key === 'Enter' && setResumeType('TAILORED')}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3 text-left',
                    resumeType === 'TAILORED'
                      ? 'border-primary bg-primary/10 shadow-2xs'
                      : 'border-border bg-card hover:bg-accent/40',
                  )}
                >
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-extrabold text-foreground">Currículo Sob Medida (ATS)</p>
                      {tailoredResume ? (
                        <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">Pronto</span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground bg-accent px-1.5 py-0.5 rounded-full">IA Gerado</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Currículo otimizado com palavras-chave e match para esta vaga de {jobTitle}.
                    </p>
                  </div>
                </div>

                {/* 2. Profile Standard Option */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setResumeType('PROFILE')}
                  onKeyDown={(e) => e.key === 'Enter' && setResumeType('PROFILE')}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3 text-left',
                    resumeType === 'PROFILE'
                      ? 'border-primary bg-primary/10 shadow-2xs'
                      : 'border-border bg-card hover:bg-accent/40',
                  )}
                >
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-foreground">
                    <FileText className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-foreground">Currículo Padrão do Perfil</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Envia seu histórico completo cadastrado na plataforma InHire Hub.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Acceptance */}
            <div className="rounded-xl border border-border/80 bg-accent/10 p-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={privacyPolicyAccepted}
                  onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-primary text-primary focus:ring-primary"
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  Concordo com o compartilhamento dos meus dados para avaliação do processo seletivo da vaga em{' '}
                  <strong className="text-foreground">{company}</strong> de acordo com a LGPD e termos da InHire.
                </span>
              </label>
              {errors.privacy && <p className="mt-1.5 text-[11px] text-destructive font-semibold">{errors.privacy}</p>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={submitting}
                className="h-10 flex-1 rounded-xl text-xs font-bold gap-1"
              >
                <ArrowLeft className="size-3.5" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-10 flex-1 rounded-xl text-xs font-black gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" /> Concluir Candidatura
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Conclusão & Sucesso */}
        {step === 4 && (
          <div className="text-center py-2 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md animate-bounce duration-1000">
              <CheckCircle2 className="size-7" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-foreground">
                Candidatura Enviada com Sucesso!
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Seus dados e currículo foram registrados para a vaga <strong className="text-foreground">{jobTitle}</strong> na empresa <strong className="text-foreground">{company}</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-accent/20 p-3 text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Candidato:</span>
                <span className="font-bold text-foreground">{name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">E-mail:</span>
                <span className="font-bold text-foreground truncate max-w-[180px]">{email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Currículo:</span>
                <span className="font-bold text-foreground">
                  {resumeType === 'TAILORED' ? '⚡ Sob Medida (ATS)' : '📄 Padrão do Perfil'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button size="sm" className="w-full h-9 rounded-xl text-xs font-bold gap-1.5" asChild>
                <a href={jobUrl} target="_blank" rel="noreferrer">
                  Ver Vaga Oficial no InHire <ExternalLink className="size-3" />
                </a>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {onToggleFavorite && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onToggleFavorite}
                    className="h-9 rounded-xl text-xs font-semibold gap-1"
                  >
                    <Bookmark className={cn('size-3.5', isFavorited && 'fill-primary text-primary')} />
                    {isFavorited ? 'Salva' : 'Salvar Vaga'}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-9 rounded-xl text-xs font-semibold gap-1"
                >
                  <Share2 className="size-3.5" />
                  {copiedLink ? 'Copiado!' : 'Compartilhar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      {step < 4 && (
        <div className="border-t border-border/60 bg-accent/10 px-4 py-2.5 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
            <ShieldCheck className="size-3 text-primary" /> Candidatura direta e segura via InHire Hub
          </p>
        </div>
      )}
    </Card>
  )
}
