import { NotFoundException } from '@nestjs/common'
import { CandidateProfileStatus } from '@prisma/client'
import { ProfileService } from './profile.service'
import type { PrismaService } from '../prisma/prisma.service'
import type { UpdateProfileDto } from './dto/profile.dto'

describe('ProfileService', () => {
  let service: ProfileService
  let prisma: {
    candidateProfile: {
      findUnique: jest.Mock
      upsert: jest.Mock
      update: jest.Mock
    }
  }

  beforeEach(() => {
    prisma = {
      candidateProfile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    }
    service = new ProfileService(prisma as unknown as PrismaService)
  })

  describe('update', () => {
    it('deve atualizar dados pessoais, experiências e formações com remoção e adição de itens', async () => {
      const userId = 'user-123'
      const existingProfile = {
        id: 'profile-1',
        userId,
        status: CandidateProfileStatus.NEEDS_REVIEW,
        professionalTitle: 'Dev Junior',
        location: 'Rio de Janeiro',
        phone: '11111111',
        seniority: 'Júnior',
        summary: 'Resumo antigo',
        skills: ['JavaScript'],
        experiences: [
          { company: 'Empresa A', title: 'Junior Dev', ongoing: false },
          { company: 'Empresa B', title: 'Estagiário', ongoing: false },
        ],
        education: [
          { school: 'Escola A', degree: 'Ensino Médio', ongoing: false },
          { school: 'Escola B', degree: 'Técnico', ongoing: false },
        ],
      }

      prisma.candidateProfile.findUnique.mockResolvedValue(existingProfile)

      const updateInput: UpdateProfileDto = {
        professionalTitle: 'Staff Engineer & Tech Lead',
        location: 'São Paulo, SP, Brasil',
        phone: '(11) 98888-7777',
        seniority: 'Staff / Especialista',
        summary: 'Resumo profissional atualizado.',
        skills: ['TypeScript', 'NestJS', 'React', 'Docker'],
        alertsEnabled: true,
        // Experiências: Empresa B removida, Empresa A atualizada, Empresa C adicionada
        experiences: [
          {
            company: 'Empresa A Atualizada',
            title: 'Lead Architect',
            startMonth: 'Jan',
            startYear: '2023',
            endMonth: null,
            endYear: null,
            ongoing: true,
            location: 'Remoto',
            description: 'Liderança técnica e arquitetura.',
          },
          {
            company: 'Empresa C Nova',
            title: 'Staff Specialist',
            startMonth: 'Feb',
            startYear: '2026',
            endMonth: null,
            endYear: null,
            ongoing: true,
            location: 'São Paulo',
            description: 'Especialista em microsserviços.',
          },
        ],
        // Formações: Escola B removida, Escola A atualizada
        education: [
          {
            school: 'Universidade Federal',
            degree: 'Bacharelado',
            field: 'Ciência da Computação',
            startMonth: 'Mar',
            startYear: '2018',
            endMonth: 'Dec',
            endYear: '2022',
            ongoing: false,
          },
        ],
      }

      const updatedRecord = {
        ...existingProfile,
        ...updateInput,
        status: CandidateProfileStatus.COMPLETE,
        reviewedAt: new Date(),
        extractedText: null,
      }

      prisma.candidateProfile.update.mockResolvedValue(updatedRecord)

      const result = await service.update(userId, updateInput)

      expect(prisma.candidateProfile.findUnique).toHaveBeenCalledWith({ where: { userId } })
      expect(prisma.candidateProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: expect.objectContaining({
          professionalTitle: 'Staff Engineer & Tech Lead',
          location: 'São Paulo, SP, Brasil',
          phone: '(11) 98888-7777',
          seniority: 'Staff / Especialista',
          summary: 'Resumo profissional atualizado.',
          skills: ['TypeScript', 'NestJS', 'React', 'Docker'],
          experiences: expect.arrayContaining([
            expect.objectContaining({ company: 'Empresa A Atualizada', title: 'Lead Architect' }),
            expect.objectContaining({ company: 'Empresa C Nova', title: 'Staff Specialist' }),
          ]),
          education: expect.arrayContaining([
            expect.objectContaining({ school: 'Universidade Federal', degree: 'Bacharelado' }),
          ]),
          status: CandidateProfileStatus.COMPLETE,
          reviewedAt: expect.any(Date),
          extractedText: null,
        }),
      })

      expect(result).toBeDefined()
      expect(result?.status).toBe(CandidateProfileStatus.COMPLETE)
      expect(result?.professionalTitle).toBe('Staff Engineer & Tech Lead')
      expect(result?.experiences).toHaveLength(2)
      expect(result?.education).toHaveLength(1)
    })

    it('deve lançar NotFoundException quando tentar atualizar perfil inexistente', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(null)

      await expect(
        service.update('non-existent-user', { professionalTitle: 'Engineer' }),
      ).rejects.toThrow(NotFoundException)
    })
  })
})
