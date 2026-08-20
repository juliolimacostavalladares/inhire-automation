import { PlaywrightPdfRendererService } from './playwright-pdf-renderer.service';

describe('PlaywrightPdfRendererService', () => {
  let service: PlaywrightPdfRendererService;

  beforeEach(() => {
    service = new PlaywrightPdfRendererService();
  });

  it('converts markdown headers, bold, lists, and links to ATS HTML properly', () => {
    const md = `<div style="font-size: 2.2em; font-weight: bold;">JULIO LIMA</div>
<div style="font-size: 1.05em;">Desenvolvedor Front-end Senior</div>

---

### RESUMO PROFISSIONAL
Desenvolvedor com **5+ anos de experiência** em *React* e [LinkedIn](https://linkedin.com).

---

### EXPERIÊNCIA PROFISSIONAL
*   **Liderança Técnica:** Desenvolveu sistemas com **+82% de performance**.
*   **Gestão de Processos:** Coordenou entregas.
`;

    // Access private method for testing conversion
    const html = (
      service as unknown as { convertMarkdownToHtml: (m: string) => string }
    ).convertMarkdownToHtml(md);

    expect(html).toContain('JULIO LIMA');
    expect(html).toContain('<h3 class="ats-section-title">RESUMO PROFISSIONAL</h3>');
    expect(html).toContain('<strong>5+ anos de experiência</strong>');
    expect(html).toContain('<em>React</em>');
    expect(html).toContain('<a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>');
    expect(html).toContain('<ul class="ats-list">');
    expect(html).toContain('<li><strong>Liderança Técnica:</strong> Desenvolveu sistemas com <strong>+82% de performance</strong>.</li>');
    expect(html).toContain('<hr class="ats-divider" />');
  });
});
