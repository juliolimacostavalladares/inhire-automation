import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sanitizeDatabase(): Promise<void> {
  console.log('🧹 [1/7] Removendo currículos customizados gerados (TailoredResume)...');
  const tailoredResumes = await prisma.tailoredResume.deleteMany();
  console.log(`   ✓ ${tailoredResumes.count} currículos customizados removidos.`);

  console.log('🧹 [2/7] Removendo vagas (Job)...');
  const jobs = await prisma.job.deleteMany();
  console.log(`   ✓ ${jobs.count} vagas removidas.`);

  console.log('🧹 [3/7] Removendo evidências de discovery (DiscoveryEvidence)...');
  const evidence = await prisma.discoveryEvidence.deleteMany();
  console.log(`   ✓ ${evidence.count} evidências de discovery removidas.`);

  console.log('🧹 [4/7] Removendo itens e execuções de crawler (CrawlRunItem & CrawlRun)...');
  const items = await prisma.crawlRunItem.deleteMany();
  const runs = await prisma.crawlRun.deleteMany();
  console.log(`   ✓ ${items.count} itens de execução e ${runs.count} execuções de crawler removidos.`);

  console.log('🧹 [5/7] Removendo empresas/tenants cadastrados (Tenant)...');
  const tenants = await prisma.tenant.deleteMany();
  console.log(`   ✓ ${tenants.count} tenants removidos.`);

  console.log('🧹 [6/7] Removendo perfis de candidatos e usuários (CandidateProfile & User)...');
  const profiles = await prisma.candidateProfile.deleteMany();
  const users = await prisma.user.deleteMany();
  console.log(`   ✓ ${profiles.count} perfis de candidatos e ${users.count} usuários removidos.`);

  console.log('🧹 [7/7] Otimizando e liberando espaço do banco de dados (VACUUM ANALYZE)...');
  try {
    await prisma.$executeRawUnsafe('VACUUM FULL;');
  } catch {
    await prisma.$executeRawUnsafe('VACUUM ANALYZE;');
  }
  console.log('   ✓ Espaço em disco liberado e estatísticas reorganizadas.');

  console.log('\n✨ Limpeza total do banco de dados concluída com sucesso! (100% dos dados removidos)');
}

if (require.main === module) {
  sanitizeDatabase()
    .catch((err: unknown) => {
      console.error('❌ Falha na limpeza do banco:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

