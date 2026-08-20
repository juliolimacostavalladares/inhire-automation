import { test, expect } from '@playwright/test'

test.describe('Edição, Remoção e Atualização do Perfil do Candidato', () => {
  test('deve permitir atualizar dados pessoais, editar/adicionar/remover experiências e formações e persistir com sucesso', async ({ page }) => {
    const timestamp = Date.now()
    const email = `test_edit_remove_${timestamp}@example.com`
    const password = 'Password123!*'
    const pdfPath = '/Users/macbookpro/Desktop/Profile.pdf'

    // 1. Cadastro de novo usuário
    await page.goto('/cadastro')
    await page.fill('#register-name', 'Candidato Teste E2E')
    await page.fill('#register-email', email)
    await page.fill('#register-password', password)
    await page.click('button:has-text("Criar minha conta")')

    // 2. Redirecionamento para onboarding
    await expect(page).toHaveURL(/.*\/onboarding\/perfil/)

    // 3. Upload do currículo do LinkedIn em PDF
    await page.fill('#linkedin-url', 'https://www.linkedin.com/in/juliolimacostavalladares')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(pdfPath)
    await page.click('button:has-text("Processar meu currículo")')

    // Aguarda o processamento estruturado
    await expect(page.locator('text=3. Dados Pessoais & Resumo')).toBeVisible({ timeout: 20_000 })

    // 4. Teste de Edição em "3. Dados Pessoais & Resumo"
    await page.fill('[data-testid="profile-title"]', 'Staff Engineer & Tech Lead')
    await page.fill('[data-testid="profile-location"]', 'São Paulo, SP, Brasil')
    await page.fill('[data-testid="profile-phone"]', '(11) 98888-7777')
    await page.fill('[data-testid="profile-seniority"]', 'Staff / Especialista')
    await page.fill('[data-testid="profile-skills"]', 'TypeScript, NestJS, React, Docker, Kubernetes')
    await page.fill('[data-testid="profile-summary"]', 'Resumo profissional atualizado com foco em liderança técnica e arquitetura distribuída.')

    // 5. Teste de Edição, Remoção e Adição em "Experiências Profissionais"
    const expCardsBefore = page.locator('[data-testid^="exp-card-"]')
    await expect(expCardsBefore).toHaveCount(4)

    // Remove a 2ª experiência
    await page.click('[data-testid="exp-remove-1"]')
    await expect(page.locator('[data-testid^="exp-card-"]')).toHaveCount(3)

    // Edita a 1ª experiência
    await page.fill('[data-testid="exp-company-0"]', 'Greenn Tech Inc')
    await page.fill('[data-testid="exp-title-0"]', 'Principal Software Architect')
    await page.fill('[data-testid="exp-location-0"]', 'Global Remote')
    await page.fill('[data-testid="exp-desc-0"]', 'Liderança global de arquitetura e times de IA.')

    // Adiciona uma nova experiência
    await page.click('[data-testid="btn-add-experience"]')
    await expect(page.locator('[data-testid^="exp-card-"]')).toHaveCount(4)
    await page.fill('[data-testid="exp-company-3"]', 'InHire Systems')
    await page.fill('[data-testid="exp-title-3"]', 'Senior Fullstack Specialist')
    await page.fill('[data-testid="exp-start-month-3"]', 'Jan')
    await page.fill('[data-testid="exp-start-year-3"]', '2026')
    await page.fill('[data-testid="exp-location-3"]', 'Remoto, Brasil')

    // 6. Teste de Edição, Remoção e Adição em "Formação Acadêmica & Cursos"
    const eduCardsBefore = page.locator('[data-testid^="edu-card-"]')
    await expect(eduCardsBefore).toHaveCount(4)

    // Remove a 4ª e a 3ª formação
    await page.click('[data-testid="edu-remove-3"]')
    await expect(page.locator('[data-testid^="edu-card-"]')).toHaveCount(3)
    await page.click('[data-testid="edu-remove-2"]')
    await expect(page.locator('[data-testid^="edu-card-"]')).toHaveCount(2)

    // Edita a 1ª formação
    await page.fill('[data-testid="edu-school-0"]', 'Universidade Federal do Rio de Janeiro (UFRJ)')
    await page.fill('[data-testid="edu-degree-0"]', 'Bacharelado')
    await page.fill('[data-testid="edu-field-0"]', 'Engenharia de Software')

    // Adiciona uma nova formação
    await page.click('[data-testid="btn-add-education"]')
    await expect(page.locator('[data-testid^="edu-card-"]')).toHaveCount(3)
    await page.fill('[data-testid="edu-school-2"]', 'MIT Executive Education')
    await page.fill('[data-testid="edu-degree-2"]', 'Certificação')
    await page.fill('[data-testid="edu-field-2"]', 'AI & Cloud Architecture')

    // 7. Confirmação e Salvamento
    await page.click('[data-testid="btn-confirm-save-profile"]')

    // 8. Verificação do redirecionamento
    await expect(page).toHaveURL(/.*\/vagas/, { timeout: 15_000 })

    // 9. Validação de persistência no backend (via GET /me/profile)
    const profileData = await page.evaluate(async () => {
      const token = localStorage.getItem('inhire_token')
      const res = await fetch('http://localhost:3000/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
      return res.json()
    })

    expect(profileData.status).toBe('COMPLETE')
    expect(profileData.professionalTitle).toBe('Staff Engineer & Tech Lead')
    expect(profileData.location).toBe('São Paulo, SP, Brasil')
    expect(profileData.phone).toBe('(11) 98888-7777')
    expect(profileData.seniority).toBe('Staff / Especialista')
    expect(profileData.summary).toBe('Resumo profissional atualizado com foco em liderança técnica e arquitetura distribuída.')
    expect(profileData.skills).toContain('TypeScript')
    expect(profileData.skills).toContain('NestJS')
    expect(profileData.skills).toContain('Kubernetes')

    // Validação das experiências salvas
    expect(profileData.experiences).toHaveLength(4)
    expect(profileData.experiences[0].company).toBe('Greenn Tech Inc')
    expect(profileData.experiences[0].title).toBe('Principal Software Architect')
    expect(profileData.experiences[3].company).toBe('InHire Systems')
    expect(profileData.experiences[3].title).toBe('Senior Fullstack Specialist')

    // Validação das formações salvas
    expect(profileData.education).toHaveLength(3)
    expect(profileData.education[0].school).toBe('Universidade Federal do Rio de Janeiro (UFRJ)')
    expect(profileData.education[0].degree).toBe('Bacharelado')
    expect(profileData.education[2].school).toBe('MIT Executive Education')
    expect(profileData.education[2].field).toBe('AI & Cloud Architecture')
  })
})
