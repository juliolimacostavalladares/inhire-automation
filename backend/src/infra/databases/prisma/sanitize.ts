import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sanitizeDatabase(): Promise<void> {
  console.log('🧹 [1/6] Higienizando Tenants (espaços em branco e slugs)...');
  const tenants = await prisma.tenant.findMany();
  let sanitizedTenantsCount = 0;
  for (const tenant of tenants) {
    const trimmedSlug = tenant.slug.trim().toLowerCase();
    const trimmedName = tenant.name.trim();
    if (trimmedSlug !== tenant.slug || trimmedName !== tenant.name) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { slug: trimmedSlug, name: trimmedName },
      });
      sanitizedTenantsCount++;
    }
  }
  console.log(`   ✓ ${sanitizedTenantsCount} tenants normalizados.`);

  console.log('🧹 [2/6] Higienizando Usuários (emails e nomes)...');
  const users = await prisma.user.findMany();
  let sanitizedUsersCount = 0;
  for (const user of users) {
    const trimmedEmail = user.email.trim().toLowerCase();
    const trimmedName = user.name.trim();
    if (trimmedEmail !== user.email || trimmedName !== user.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: trimmedEmail, name: trimmedName },
      });
      sanitizedUsersCount++;
    }
  }
  console.log(`   ✓ ${sanitizedUsersCount} usuários normalizados.`);

  console.log('🧹 [3/6] Higienizando Perfis de Candidatos...');
  const profiles = await prisma.candidateProfile.findMany();
  let sanitizedProfilesCount = 0;
  for (const profile of profiles) {
    let updated = false;
    const data: Record<string, unknown> = {};

    if (
      profile.extractedText &&
      profile.extractedText.includes(String.fromCharCode(0))
    ) {
      data.extractedText = profile.extractedText
        .replaceAll(String.fromCharCode(0), '')
        .trim();
      updated = true;
    }

    if (profile.status === 'COMPLETE' && profile.extractedText !== null) {
      data.extractedText = null;
      updated = true;
    }

    if (
      profile.professionalTitle &&
      profile.professionalTitle !== profile.professionalTitle.trim()
    ) {
      data.professionalTitle = profile.professionalTitle.trim();
      updated = true;
    }

    if (profile.phone && profile.phone !== profile.phone.trim()) {
      data.phone = profile.phone.trim();
      updated = true;
    }

    if (profile.location && profile.location !== profile.location.trim()) {
      data.location = profile.location.trim();
      updated = true;
    }

    if (Array.isArray(profile.skills)) {
      const cleanedSkills = Array.from(
        new Set(
          profile.skills
            .filter(
              (s): s is string => typeof s === 'string' && s.trim().length > 0,
            )
            .map((s) => s.trim()),
        ),
      );
      if (JSON.stringify(cleanedSkills) !== JSON.stringify(profile.skills)) {
        data.skills = cleanedSkills;
        updated = true;
      }
    }

    if (updated) {
      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data,
      });
      sanitizedProfilesCount++;
    }
  }
  console.log(`   ✓ ${sanitizedProfilesCount} perfis higienizados.`);

  console.log('🧹 [4/6] Higienizando Vagas (títulos, locais e URLs)...');
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      workplaceType: true,
      location: true,
      url: true,
    },
  });
  let sanitizedJobsCount = 0;
  for (const job of jobs) {
    const trimmedTitle = job.title.trim();
    const trimmedLocation = job.location ? job.location.trim() : null;
    const trimmedWorkplace = job.workplaceType
      ? job.workplaceType.trim()
      : null;
    const trimmedUrl = job.url.trim();

    if (
      trimmedTitle !== job.title ||
      trimmedLocation !== job.location ||
      trimmedWorkplace !== job.workplaceType ||
      trimmedUrl !== job.url
    ) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          title: trimmedTitle,
          location: trimmedLocation,
          workplaceType: trimmedWorkplace,
          url: trimmedUrl,
        },
      });
      sanitizedJobsCount++;
    }
  }
  console.log(`   ✓ ${sanitizedJobsCount} vagas normalizadas.`);

  console.log('🧹 [5/6] Higienizando Execuções Travadas de Crawler...');
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const stuckRuns = await prisma.crawlRun.updateMany({
    where: {
      status: { in: ['RUNNING', 'QUEUED'] },
      createdAt: { lt: twoHoursAgo },
    },
    data: {
      status: 'FAILED',
      error: 'Interrompido por rotina de higienização do sistema',
      finishedAt: new Date(),
    },
  });
  console.log(`   ✓ ${stuckRuns.count} execuções travadas marcadas como FAILED.`);

  console.log('🧹 [6/6] Otimizando Índices e Estatísticas do Banco (VACUUM ANALYZE)...');
  await prisma.$executeRawUnsafe('VACUUM ANALYZE;');
  console.log('   ✓ Otimização e reindexação concluídas.');

  console.log('\n✨ Higienização do banco de dados concluída com sucesso!');
}

if (require.main === module) {
  sanitizeDatabase()
    .catch((err: unknown) => {
      console.error('❌ Falha na higienização:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
