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

interface ApplicationFormProps {
  jobId: string
  jobTitle: string
  company: string
  jobUrl: string
  initialFormStructure?: ApplicationFormStructure | null
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

const FIELD_ICONS: Record<string, ReactNode> = {
  name: <User className="size-4 text-muted-foreground" />,
  email: <Mail className="size-4 text-muted-foreground" />,
  phone: <Phone className="size-4 text-muted-foreground" />,
  location: <MapPin className="size-4 text-muted-foreground" />,
  city: <MapPin className="size-4 text-muted-foreground" />,
  cep: <MapPin className="size-4 text-muted-foreground" />,
  linkedinUsername: <Globe className="size-4 text-muted-foreground" />,
  salaryExpectation: <DollarSign className="size-4 text-muted-foreground" />,
}

export function ApplicationFormWizard({
  jobId,
  jobTitle,
  company,
  jobUrl,
  initialFormStructure,
  isFavorited = false,
  onToggleFavorite,
}: ApplicationFormProps) {
  const { user } = useAuth()
  const { profile, hydrate } = useProfileStore()

  const [formStructure, setFormStructure] = useState<ApplicationFormStructure | null>(
    initialFormStructure ?? null,
  )
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null)

  // Dynamic values stored by field key and question ID
  const [values, setValues] = useState<Record<string, string>>({
    country: 'Brasil',
    workModel: 'Sim',
    hasReferral: 'Não',
  })
  const [resumeType, setResumeType] = useState<'TAILORED' | 'PROFILE'>('TAILORED')
  const [coverNote, setCoverNote] = useState('')
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(true)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
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
      }
      return next
    })
  }, [user, profile])

  // Ordered fields from backend
  const dynamicFields = useMemo(() => {
    const fields = formStructure?.fields ?? [
      { key: 'name', label: 'Nome completo', placeholder: 'Seu nome completo', type: 'text', required: true, options: [] },
      { key: 'email', label: 'Seu melhor email', placeholder: 'Seu melhor email', type: 'email', required: true, options: [] },
      { key: 'phone', label: 'Celular com DDD', placeholder: '(00) 00000-0000', helpText: '+55', type: 'tel', required: true, options: [] },
      { key: 'privacyPolicyAccepted', label: 'Ao fornecer seus dados pessoais, você concorda com o que está descrito nesta Política de Privacidade.', type: 'boolean', required: true, options: [] },
    ]

    return fields.filter((f) => f.key !== 'privacyPolicyAccepted' && f.key !== 'curriculum')
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

  // Full form validation matching InHire rules
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    for (const field of dynamicFields) {
      if (field.key === 'referral') {
        if (values.hasReferral === 'Sim' && !(values.referralEmail || '').trim()) {
          newErrors.referralEmail = 'Informe o e-mail ou nome de quem indicou você'
        }
        continue
      }

      const val = (values[field.key] || '').trim()
      if (field.required && !val) {
        newErrors[field.key] = `${field.label || 'Este campo'} é obrigatório`
      } else if (field.key === 'email' && val && !val.includes('@')) {
        newErrors.email = 'E-mail inválido'
      }
    }

    for (const q of visibleQuestions) {
      const val = (values[q.id] || '').trim()
      if (q.required && !val) {
        newErrors[q.id] = 'Esta pergunta é obrigatória'
      }
    }

    if (!privacyPolicyAccepted) {
      newErrors.privacy = 'Você precisa concordar com os termos de privacidade para continuar'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

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
        answers: {
          ...questionAnswers,
          ...(values.country ? { country: values.country } : {}),
          ...(values.hasReferral === 'Sim' ? { referral: values.referralEmail } : {}),
        },
        privacyPolicyAccepted,
      }

      await applyToJob(jobId, payload)
      setIsSubmitted(true)
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

  // Render a single dynamic form field matching InHire's exact logic and design
  const renderField = (field: ApplicationFormField) => {
    const val = values[field.key] || ''
    const label = field.label || field.key
    const placeholder = field.placeholder || `Informe ${label.toLowerCase()}`
    const icon = FIELD_ICONS[field.key]
    const hasError = Boolean(errors[field.key])

    // 1. Work Model (Disponibilidade para trabalhar no modelo da vaga: Sim / Não)
    if (field.key === 'workModel' || (field.type === 'boolean' && field.options?.includes('Sim'))) {
      const currentChoice = values.workModel || 'Sim'
      return (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground leading-snug">
            {label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {(['Sim', 'Não'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleFieldChange('workModel', opt)}
                className={cn(
                  'h-10 rounded-xl border text-xs font-bold transition-all text-center',
                  currentChoice === opt
                    ? 'border-primary bg-primary text-primary-foreground font-black shadow-2xs'
                    : 'border-border bg-background text-foreground hover:bg-accent',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {hasError && <p className="text-[11px] text-destructive font-semibold">{errors[field.key]}</p>}
        </div>
      )
    }

    // 2. Referral (Você foi indicado por alguém da empresa?: Não / Sim)
    if (field.key === 'referral' || field.type === 'referral') {
      const hasReferral = values.hasReferral || 'Não'
      return (
        <div key={field.key} className="space-y-2">
          <Label className="text-xs font-bold text-foreground leading-snug">
            {label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(['Não', 'Sim'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleFieldChange('hasReferral', opt)}
                className={cn(
                  'h-10 rounded-xl border text-xs font-bold transition-all text-center',
                  hasReferral === opt
                    ? 'border-primary bg-primary text-primary-foreground font-black shadow-2xs'
                    : 'border-border bg-background text-foreground hover:bg-accent',
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          {hasReferral === 'Sim' && (
            <div className="pt-1 animate-in fade-in duration-150">
              <Input
                id="referral-email-input"
                type="text"
                value={values.referralEmail || ''}
                onChange={(e) => handleFieldChange('referralEmail', e.target.value)}
                placeholder="E-mail ou nome de quem indicou você"
                invalid={Boolean(errors.referralEmail)}
                className="h-11 text-xs rounded-xl bg-background border-input focus-within:border-primary"
              />
              {errors.referralEmail && (
                <p className="mt-1 text-[11px] text-destructive font-semibold">{errors.referralEmail}</p>
              )}
            </div>
          )}
        </div>
      )
    }

    // 3. Select fields (País de origem, Tipo de contrato, etc.)
    if (field.type === 'select' && field.options.length > 0) {
      return (
        <div key={field.key} className="space-y-1">
          <Label htmlFor={`app-field-${field.key}`} className="text-xs font-bold text-foreground">
            {label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <select
            id={`app-field-${field.key}`}
            value={val || (field.key === 'country' ? 'Brasil' : '')}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25"
          >
            <option value="">{placeholder}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {hasError && <p className="text-[11px] text-destructive font-semibold">{errors[field.key]}</p>}
        </div>
      )
    }

    // 4. Standard Text / Email / Phone / URL / Currency Inputs
    return (
      <div key={field.key} className="space-y-1">
        <Label htmlFor={`app-field-${field.key}`} className="text-xs font-bold text-foreground">
          {label} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.helpText && (
          <p className="text-[11px] text-muted-foreground leading-normal">
            {field.helpText}
          </p>
        )}
        <div className="relative">
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
        {hasError && <p className="text-[11px] text-destructive font-semibold">{errors[field.key]}</p>}
      </div>
    )
  }

  // Render a dynamic question
  const renderDynamicQuestion = (q: DiversityQuestion) => {
    const val = values[q.id] || ''
    const hasError = Boolean(errors[q.id])

    return (
      <div key={q.id} className="space-y-1">
        <Label className="text-xs font-bold text-foreground leading-snug">
          {q.question || q.title} {q.required && <span className="text-destructive">*</span>}
        </Label>
        {q.subTitle && <p className="text-[11px] text-muted-foreground leading-normal">{q.subTitle}</p>}

        {q.options && q.options.length > 0 ? (
          <select
            value={val}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground outline-none focus:border-primary"
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
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
          />
        ) : (
          <Input
            value={val}
            onChange={(e) => handleFieldChange(q.id, e.target.value)}
            placeholder={q.placeholder || 'Sua resposta…'}
            invalid={hasError}
            className="h-10 text-xs rounded-xl bg-background"
          />
        )}
        {hasError && <p className="text-[11px] text-destructive font-semibold">{errors[q.id]}</p>}
      </div>
    )
  }

  // SUCCESS SCREEN
  if (isSubmitted) {
    return (
      <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all rounded-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
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
      </Card>
    )
  }

  // MAIN UNIFIED APPLICATION FORM (MATCHING INHIRE SITE)
  return (
    <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all rounded-2xl">
      {/* Form Header */}
      <div className="border-b border-border bg-accent/15 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-black text-xs shadow-2xs">
              <Briefcase className="size-3.5" />
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-foreground">
              CANDIDATURA DIRETA
            </span>
          </div>

          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
            InHire Hub
          </span>
        </div>

        <div className="mt-3">
          <h3 className="text-base font-extrabold tracking-tight text-foreground">
            Formulário de Inscrição
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Preencha os dados solicitados pela <strong>{company}</strong> para esta oportunidade.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive flex items-start gap-2"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Dynamic Fields in Exact InHire Order */}
        {dynamicFields.map(renderField)}

        {/* Currículo Section */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-bold text-foreground leading-snug">
            Currículo <span className="text-destructive">*</span>
          </Label>

          <div className="space-y-2">
            {/* Tailored Resume Option */}
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
                  Otimizado com palavras-chave e compatibilidade ATS para esta vaga.
                </p>
              </div>
            </div>

            {/* Profile Standard Option */}
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
                  Envia os dados profissionais cadastrados no seu perfil InHire.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diversity Questions (if configured on vacancy) */}
        {visibleQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            {formStructure?.diversityIntroductionHtml && (
              <div
                className="rounded-xl border border-border bg-accent/10 p-3 text-xs text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formStructure.diversityIntroductionHtml }}
              />
            )}
            {visibleQuestions.map(renderDynamicQuestion)}
          </div>
        )}

        {/* Optional Cover Note */}
        <div className="space-y-1 pt-1">
          <Label htmlFor="applicant-cover-note" className="text-xs font-bold text-foreground">
            Mensagem de Apresentação (Opcional)
          </Label>
          <textarea
            id="applicant-cover-note"
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Destaque seus pontos fortes e por que tem interesse nesta oportunidade…"
            rows={3}
            className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25 resize-none"
          />
        </div>

        {/* Privacy Policy Disclaimer & Consent */}
        <div className="rounded-2xl border border-border bg-accent/15 p-3.5">
          <label className="flex items-start gap-2.5 cursor-pointer text-left">
            <input
              type="checkbox"
              checked={privacyPolicyAccepted}
              onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
              className="mt-0.5 size-4 rounded accent-primary text-primary focus:ring-primary"
            />
            <span className="text-[11px] leading-relaxed text-muted-foreground">
              Ao fornecer seus dados pessoais, você concorda com o que está descrito nesta{' '}
              {formStructure?.privacyPolicyUrl ? (
                <a
                  href={formStructure.privacyPolicyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline font-bold"
                >
                  Política de Privacidade
                </a>
              ) : (
                'Política de Privacidade'
              )}
              .
            </span>
          </label>
          {errors.privacy && <p className="mt-1 text-[11px] text-destructive font-semibold">{errors.privacy}</p>}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl text-sm font-black gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Enviando Inscrição…
            </>
          ) : (
            <>
              <Send className="size-4" /> Continuar inscrição
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="border-t border-border bg-accent/10 px-5 py-3 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" /> Candidatura direta e integrada via InHire Hub
        </p>
      </div>
    </Card>
  )
}
