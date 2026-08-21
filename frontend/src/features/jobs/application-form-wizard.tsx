import { useState, useEffect, useMemo, type ReactNode } from 'react'
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
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { useProfileStore } from '@/features/profile/profile.store'
import {
  getApplicationForm,
  applyToJob,
  getJobTailoredResume,
  type ApplicationFormStructure,
  type ApplicationFormField,
  type DiversityQuestion,
  type TailoredResume,
} from './jobs.api'
import { getApiErrorMessage } from '@/lib/api/http'
import { cn } from '@/lib/utils'

interface ApplicationFormWizardProps {
  jobId: string
  jobTitle: string
  company: string
  jobUrl: string
  initialFormStructure?: ApplicationFormStructure | null
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

type WizardStep = 1 | 2 | 3 | 4

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome completo',
  email: 'E-mail',
  phone: 'WhatsApp / Celular',
  location: 'Cidade / Estado',
  cep: 'CEP',
  linkedinUsername: 'Perfil do LinkedIn',
  referralEmail: 'E-mail de Indicação',
  salaryExpectation: 'Pretensão Salarial',
  contractType: 'Tipo de Contrato',
  workModel: 'Modalidade de Trabalho',
  curriculum: 'Currículo',
}

const FIELD_PLACEHOLDERS: Record<string, string> = {
  name: 'Ex: Júlio Lima',
  email: 'seu.email@exemplo.com',
  phone: '(11) 99999-9999',
  location: 'São Paulo, SP',
  cep: '01001-000',
  linkedinUsername: 'linkedin.com/in/seuperfil',
  referralEmail: 'colega@empresa.com',
  salaryExpectation: 'R$ 10.000,00',
}

const FIELD_ICONS: Record<string, ReactNode> = {
  name: <User className="size-4 text-muted-foreground" />,
  email: <Mail className="size-4 text-muted-foreground" />,
  phone: <Phone className="size-4 text-muted-foreground" />,
  location: <MapPin className="size-4 text-muted-foreground" />,
  cep: <MapPin className="size-4 text-muted-foreground" />,
  linkedinUsername: <Globe className="size-4 text-muted-foreground" />,
  referralEmail: <Mail className="size-4 text-muted-foreground" />,
  salaryExpectation: <DollarSign className="size-4 text-muted-foreground" />,
}

const CONTACT_FIELD_KEYS = new Set([
  'name',
  'email',
  'phone',
  'location',
  'cep',
  'linkedinUsername',
  'referralEmail',
])

export function ApplicationFormWizard({
  jobId,
  jobTitle,
  company,
  jobUrl,
  initialFormStructure,
  isFavorited = false,
  onToggleFavorite,
}: ApplicationFormWizardProps) {
  const { user } = useAuth()
  const { profile, hydrate } = useProfileStore()

  const [step, setStep] = useState<WizardStep>(1)
  const [formStructure, setFormStructure] = useState<ApplicationFormStructure | null>(
    initialFormStructure ?? null,
  )
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null)

  // Dynamic values stored by field key and question ID
  const [values, setValues] = useState<Record<string, string>>({})
  const [resumeType, setResumeType] = useState<'TAILORED' | 'PROFILE'>('TAILORED')
  const [coverNote, setCoverNote] = useState('')
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(true)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 1. Fetch user profile if logged in
  useEffect(() => {
    if (user && !profile) {
      void hydrate()
    }
  }, [user, profile, hydrate])

  // 2. Fetch Job Application Form Structure & Tailored Resume
  useEffect(() => {
    let active = true

    if (!formStructure) {
      void getApplicationForm(jobId).then((data) => {
        if (active && data) {
          setFormStructure(data)
        }
      })
    }

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
  }, [jobId, user, formStructure])

  // 3. Auto-fill initial values from user and candidate profile
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev }
      if (user) {
        if (!next.name && user.name) next.name = user.name
        if (!next.email && user.email) next.email = user.email
      }
      if (profile) {
        if (!next.phone && profile.phone) next.phone = profile.phone
        if (!next.location && profile.location) next.location = profile.location
        if (!next.linkedinUsername && profile.linkedinProfileUrl) {
          next.linkedinUsername = profile.linkedinProfileUrl
        }
        if (!next.salaryExpectation && profile.salaryExpectation) {
          next.salaryExpectation = profile.salaryExpectation
        }
        if (!next.contractType && profile.contractTypes && profile.contractTypes.length > 0) {
          next.contractType = profile.contractTypes[0]
        }
        if (!next.workModel && profile.workModalities && profile.workModalities.length > 0) {
          next.workModel = profile.workModalities[0]
        }
      }
      return next
    })
  }, [user, profile])

  // Split dynamic fields from backend into wizard steps
  const { contactFields, jobFields } = useMemo(() => {
    const fields = formStructure?.fields ?? [
      { key: 'name', type: 'text', required: true, options: [] },
      { key: 'email', type: 'email', required: true, options: [] },
      { key: 'phone', type: 'tel', required: true, options: [] },
      { key: 'privacyPolicyAccepted', type: 'boolean', required: true, options: [] },
    ]

    const contact: ApplicationFormField[] = []
    const job: ApplicationFormField[] = []

    for (const field of fields) {
      if (field.key === 'curriculum' || field.key === 'privacyPolicyAccepted') {
        continue
      }
      if (CONTACT_FIELD_KEYS.has(field.key)) {
        contact.push(field)
      } else {
        job.push(field)
      }
    }

    // Ensure name, email, phone exist in contact step as base requirements
    const keysPresent = new Set(contact.map((f) => f.key))
    if (!keysPresent.has('name')) contact.unshift({ key: 'name', type: 'text', required: true, options: [] })
    if (!keysPresent.has('email')) contact.splice(1, 0, { key: 'email', type: 'email', required: true, options: [] })
    if (!keysPresent.has('phone')) contact.splice(2, 0, { key: 'phone', type: 'tel', required: true, options: [] })

    return { contactFields: contact, jobFields: job }
  }, [formStructure])

  // Diversity & custom vacancy questions from backend
  const visibleQuestions = useMemo(() => {
    const questions = formStructure?.diversityQuestions ?? []
    return questions.filter((q) => {
      if (!q.dependsOnQuestionId) return true
      const parentAnswer = values[q.dependsOnQuestionId]
      if (!parentAnswer) return false
      const parentQ = questions.find((item) => item.id === q.dependsOnQuestionId)
      if (!parentQ) return true
      const matchingOption = parentQ.options.find(
        (opt) => (opt.title || opt.id) === parentAnswer,
      )
      return matchingOption ? matchingOption.revealsQuestionIds.includes(q.id) : false
    })
  }, [formStructure, values])

  // Field change handler
  const handleFieldChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  // Validation handlers
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}
    for (const field of contactFields) {
      const val = (values[field.key] || '').trim()
      if (field.required && !val) {
        newErrors[field.key] = `${FIELD_LABELS[field.key] || 'Este campo'} é obrigatório`
      } else if (field.key === 'email' && val && !val.includes('@')) {
        newErrors.email = 'E-mail inválido'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}
    for (const field of jobFields) {
      const val = (values[field.key] || '').trim()
      if (field.required && !val) {
        newErrors[field.key] = `${FIELD_LABELS[field.key] || 'Este campo'} é obrigatório`
      }
    }
    for (const q of visibleQuestions) {
      const val = (values[q.id] || '').trim()
      if (q.required && !val) {
        newErrors[q.id] = 'Esta pergunta é obrigatória'
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
      const questionAnswers: Record<string, string> = {}
      for (const q of visibleQuestions) {
        if (values[q.id]) questionAnswers[q.id] = values[q.id]
      }

      const payload = {
        name: (values.name || user?.name || '').trim(),
        email: (values.email || user?.email || '').trim(),
        phone: (values.phone || '').trim(),
        location: (values.location || '').trim() || undefined,
        linkedinUrl: (values.linkedinUsername || '').trim() || undefined,
        salaryExpectation: (values.salaryExpectation || '').trim() || undefined,
        contractType: values.contractType || undefined,
        workModel: values.workModel || undefined,
        coverNote: coverNote.trim() || undefined,
        resumeType,
        answers: Object.keys(questionAnswers).length > 0 ? questionAnswers : undefined,
        privacyPolicyAccepted,
      }

      await applyToJob(jobId, payload)
      setStep(4)
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, 'Não foi possível enviar sua candidatura. Tente novamente.'),
      )
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

  // Render a single dynamic form field from backend
  const renderDynamicField = (field: ApplicationFormField) => {
    const val = values[field.key] || ''
    const label = FIELD_LABELS[field.key] || field.key
    const placeholder = FIELD_PLACEHOLDERS[field.key] || `Informe ${label.toLowerCase()}`
    const icon = FIELD_ICONS[field.key]
    const hasError = Boolean(errors[field.key])

    if (field.type === 'select' && field.options.length > 0) {
      return (
        <div key={field.key}>
          <Label className="text-xs font-bold text-foreground">
            {label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <select
            value={val}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25"
          >
            <option value="">Selecione…</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {hasError && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors[field.key]}</p>}
        </div>
      )
    }

    if (field.key === 'workModel' || (field.type === 'boolean' && field.key.toLowerCase().includes('model'))) {
      const currentModel = val || 'Remoto'
      return (
        <div key={field.key}>
          <Label className="text-xs font-bold text-foreground">
            {label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(['Remoto', 'Híbrido', 'Presencial'] as const).map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => handleFieldChange(field.key, model)}
                className={cn(
                  'h-9 rounded-xl border text-xs font-bold transition-all text-center',
                  currentModel === model
                    ? 'border-primary bg-primary text-primary-foreground font-black shadow-2xs'
                    : 'border-border bg-background text-foreground hover:bg-accent',
                )}
              >
                {model}
              </button>
            ))}
          </div>
          {hasError && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors[field.key]}</p>}
        </div>
      )
    }

    return (
      <div key={field.key}>
        <Label htmlFor={`app-field-${field.key}`} className="text-xs font-bold text-foreground">
          {label} {field.required && <span className="text-destructive">*</span>}
        </Label>
        <div className="mt-1.5">
          <Input
            id={`app-field-${field.key}`}
            type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
            value={val}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={placeholder}
            startIcon={icon}
            invalid={hasError}
            className="h-11 text-xs rounded-xl bg-background border-input focus-within:border-primary"
          />
        </div>
        {hasError && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors[field.key]}</p>}
      </div>
    )
  }

  // Render a dynamic diversity / vacancy question from backend
  const renderDynamicQuestion = (q: DiversityQuestion) => {
    const val = values[q.id] || ''
    const hasError = Boolean(errors[q.id])

    return (
      <div key={q.id}>
        <Label className="text-xs font-bold text-foreground">
          {q.question || q.title} {q.required && <span className="text-destructive">*</span>}
        </Label>
        {q.subTitle && <p className="text-[11px] text-muted-foreground mb-1">{q.subTitle}</p>}

        {q.options && q.options.length > 0 ? (
          <select
            value={val}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            <option value="">Selecione uma opção</option>
            {q.options.map((opt) => (
              <option key={opt.id} value={opt.title || opt.id}>
                {opt.title}
              </option>
            ))}
          </select>
        ) : q.answerType === 'textarea' ? (
          <textarea
            value={val}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Sua resposta…'}
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
          />
        ) : (
          <Input
            value={val}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Sua resposta…'}
            invalid={hasError}
            className="mt-1.5 h-10 text-xs rounded-xl bg-background"
          />
        )}
        {hasError && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors[q.id]}</p>}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all rounded-2xl">
      {/* Wizard Header */}
      <div className="border-b border-border bg-accent/15 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs shadow-2xs">
              <Briefcase className="size-3.5" />
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-foreground">
              CANDIDATURA RÁPIDA
            </span>
          </div>

          {step < 4 && (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
              Passo {step} de 3
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold tracking-tight text-foreground">
            {stepTitles[step]}
          </h3>
          {step < 4 && (
            <span className="text-[11px] font-bold text-muted-foreground">
              {progressPercent}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {step < 4 && (
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="p-5">
        {submitError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-start gap-2"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* STEP 1: Identificação & Contato (campos dinâmicos do backend) */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {contactFields.map(renderDynamicField)}

            <Button
              type="button"
              onClick={handleNext}
              className="mt-2 w-full h-11 rounded-xl font-extrabold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs gap-2"
            >
              Próximo passo <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Expectativas & Perguntas da Vaga (campos dinâmicos do backend) */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Dynamic Job Requirements Fields */}
            {jobFields.length > 0 && <div className="space-y-3">{jobFields.map(renderDynamicField)}</div>}

            {/* Dynamic Diversity / Vacancy Questions */}
            {visibleQuestions.length > 0 && (
              <div className="mt-2 space-y-3 rounded-2xl border border-border bg-accent/15 p-3.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Perguntas Específicas da Vaga
                </p>
                {visibleQuestions.map(renderDynamicQuestion)}
              </div>
            )}

            {/* Optional Cover Note / Presentation */}
            <div>
              <Label htmlFor="applicant-note" className="text-xs font-bold text-foreground">
                Mensagem de Apresentação (Opcional)
              </Label>
              <textarea
                id="applicant-note"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Destaque seus pontos fortes e por que você quer trabalhar nesta oportunidade…"
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-11 flex-1 rounded-xl text-xs font-bold gap-1.5 border-border bg-card hover:bg-accent"
              >
                <ArrowLeft className="size-4" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="h-11 flex-1 rounded-xl text-xs font-extrabold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
              >
                Próximo <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Currículo & Envio */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <Label className="text-xs font-bold text-foreground">
                Selecione o Currículo para esta vaga
              </Label>
              <div className="mt-2 space-y-2.5">
                {/* 1. Tailored Resume Option */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setResumeType('TAILORED')}
                  onKeyDown={(e) => e.key === 'Enter' && setResumeType('TAILORED')}
                  className={cn(
                    'cursor-pointer rounded-2xl border p-3.5 transition-all flex items-start gap-3 text-left',
                    resumeType === 'TAILORED'
                      ? 'border-primary bg-primary/10 shadow-2xs'
                      : 'border-border bg-background hover:bg-accent/40',
                  )}
                >
                  <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-black">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-extrabold text-foreground">Currículo Sob Medida (ATS)</p>
                      {tailoredResume ? (
                        <span className="text-[10px] font-black text-primary bg-primary/20 border border-primary/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="size-2.5" /> Pronto
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                          IA Gerado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
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
                    'cursor-pointer rounded-2xl border p-3.5 transition-all flex items-start gap-3 text-left',
                    resumeType === 'PROFILE'
                      ? 'border-primary bg-primary/10 shadow-2xs'
                      : 'border-border bg-background hover:bg-accent/40',
                  )}
                >
                  <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-foreground font-black">
                    <FileText className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-foreground">Currículo Padrão do Perfil</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Envia seu histórico profissional cadastrado no InHire Hub.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Acceptance */}
            <div className="rounded-2xl border border-border bg-accent/15 p-3.5">
              <label className="flex items-start gap-2.5 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={privacyPolicyAccepted}
                  onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-primary text-primary focus:ring-primary"
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  Concordo com o compartilhamento dos meus dados para avaliação do processo seletivo da vaga em{' '}
                  <strong className="text-foreground">{company}</strong> de acordo com a LGPD e{' '}
                  {formStructure?.privacyPolicyUrl ? (
                    <a
                      href={formStructure.privacyPolicyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline font-bold"
                    >
                      política de privacidade da vaga
                    </a>
                  ) : (
                    'termos da InHire'
                  )}
                  .
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
                className="h-11 flex-1 rounded-xl text-xs font-bold gap-1.5 border-border bg-card hover:bg-accent"
              >
                <ArrowLeft className="size-4" /> Voltar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-11 flex-1 rounded-xl text-xs font-black gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="size-4" /> Concluir Candidatura
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
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
                CANDIDATURA ENVIADA
              </span>
              <h4 className="mt-2 text-lg font-black tracking-tight text-foreground">
                Candidatura Concluída!
              </h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Seus dados e currículo foram registrados para a vaga <strong className="text-foreground">{jobTitle}</strong> na empresa <strong className="text-foreground">{company}</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-accent/20 p-3.5 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Candidato:</span>
                <span className="font-extrabold text-foreground">{values.name || user?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">E-mail:</span>
                <span className="font-bold text-foreground truncate max-w-[180px]">
                  {values.email || user?.email}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Currículo:</span>
                <span className="font-extrabold text-foreground">
                  {resumeType === 'TAILORED' ? '⚡ Sob Medida (ATS)' : '📄 Padrão do Perfil'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                size="sm"
                className="w-full h-10 rounded-xl text-xs font-black gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                asChild
              >
                <a href={jobUrl} target="_blank" rel="noreferrer">
                  Ver Vaga Oficial no InHire <ExternalLink className="size-3.5" />
                </a>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {onToggleFavorite && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onToggleFavorite}
                    className="h-10 rounded-xl text-xs font-bold gap-1.5 border-border bg-card hover:bg-accent"
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
                  className="h-10 rounded-xl text-xs font-bold gap-1.5 border-border bg-card hover:bg-accent"
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
        <div className="border-t border-border bg-accent/10 px-5 py-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Candidatura direta e dinâmica via InHire Hub
          </p>
        </div>
      )}
    </Card>
  )
}
