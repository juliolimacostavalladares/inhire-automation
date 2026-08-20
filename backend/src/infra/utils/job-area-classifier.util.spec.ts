import {
  detectJobArea,
  getAreaKeywords,
  matchesArea,
  CanonicalArea,
} from './job-area-classifier.util';

describe('JobAreaClassifier', () => {
  describe('detectJobArea', () => {
    it('detects TECNOLOGIA for software developers and engineering roles regardless of tech stack', () => {
      expect(detectJobArea('Desenvolvedor(a) Full Stack Java')).toBe(CanonicalArea.TECNOLOGIA);
      expect(detectJobArea('Senior Python Developer')).toBe(CanonicalArea.TECNOLOGIA);
      expect(detectJobArea('Engenheiro de Software React Native')).toBe(CanonicalArea.TECNOLOGIA);
      expect(detectJobArea('Analista de QA / Testes')).toBe(CanonicalArea.TECNOLOGIA);
      expect(detectJobArea('DevOps Engineer AWS')).toBe(CanonicalArea.TECNOLOGIA);
    });

    it('detects SAUDE for medical, nursing and health roles', () => {
      expect(detectJobArea('Médico(a) do Trabalho')).toBe(CanonicalArea.SAUDE);
      expect(detectJobArea('Enfermeiro(a) UTI')).toBe(CanonicalArea.SAUDE);
      expect(detectJobArea('Farmacêutico Hospitalar')).toBe(CanonicalArea.SAUDE);
      expect(detectJobArea('Psicólogo(a) Clínico')).toBe(CanonicalArea.SAUDE);
    });

    it('detects FINANCAS for finance, accounting and controller roles', () => {
      expect(detectJobArea('Analista Financeiro Sênior')).toBe(CanonicalArea.FINANCAS);
      expect(detectJobArea('Controller de Controladoria')).toBe(CanonicalArea.FINANCAS);
      expect(detectJobArea('Contador Pleno')).toBe(CanonicalArea.FINANCAS);
    });

    it('detects DESIGN for UX/UI and product design roles', () => {
      expect(detectJobArea('Product Designer Pleno')).toBe(CanonicalArea.DESIGN);
      expect(detectJobArea('UX/UI Designer Sênior')).toBe(CanonicalArea.DESIGN);
    });

    it('detects RH for human resources roles', () => {
      expect(detectJobArea('Especialista de Recursos Humanos')).toBe(CanonicalArea.RH);
      expect(detectJobArea('Tech Recruiter Pleno')).toBe(CanonicalArea.RH);
    });
  });

  describe('matchesArea', () => {
    it('matches developer jobs with programming/engineering profile regardless of tech stack', () => {
      expect(matchesArea('Desenvolvedor(a) Full Stack Java', 'Programador')).toBe(true);
      expect(matchesArea('Pessoa Desenvolvedora Front End - React Pl', 'Engenharia de Software')).toBe(true);
      expect(matchesArea('Python Developer', 'Tecnologia')).toBe(true);
      expect(matchesArea('Analista Financeiro', 'Desenvolvedor')).toBe(false);
    });

    it('matches health jobs with medical profile', () => {
      expect(matchesArea('Médico(a) Plantonista', 'Medicina')).toBe(true);
      expect(matchesArea('Enfermeiro(a)', 'Saúde')).toBe(true);
      expect(matchesArea('Desenvolvedor Java', 'Medicina')).toBe(false);
    });
  });

  describe('getAreaKeywords', () => {
    it('returns keywords for recognized areas', () => {
      const techKeywords = getAreaKeywords('Desenvolvedor');
      expect(techKeywords).toContain('desenvolvedor');
      expect(techKeywords).toContain('fullstack');

      const healthKeywords = getAreaKeywords('Medicina');
      expect(healthKeywords).toContain('médico');
      expect(healthKeywords).toContain('enfermagem');
    });

    it('returns empty array for unknown areas', () => {
      expect(getAreaKeywords('XYZ123UnknownArea')).toEqual([]);
    });
  });
});
