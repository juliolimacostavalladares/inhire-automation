import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { chromium, type Browser } from 'playwright';
import type {
  IPdfRenderer,
  PdfRenderOptions,
} from '../../../app/providers/pdf-renderer.interface';

@Injectable()
export class PlaywrightPdfRendererService
  implements IPdfRenderer, OnModuleDestroy
{
  private readonly logger = new Logger(PlaywrightPdfRendererService.name);
  private browserInstance: Browser | null = null;
  private isLaunching = false;

  private async getBrowser(): Promise<Browser> {
    if (this.browserInstance && this.browserInstance.isConnected()) {
      return this.browserInstance;
    }

    if (this.isLaunching) {
      // Esperar brevemente se já estiver inicializando
      while (this.isLaunching) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (this.browserInstance && this.browserInstance.isConnected()) {
        return this.browserInstance;
      }
    }

    this.isLaunching = true;
    try {
      this.browserInstance = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });
      return this.browserInstance;
    } catch (error) {
      this.logger.error('Erro ao inicializar o Chromium via Playwright:', error);
      throw new InternalServerErrorException(
        'Falha ao inicializar o motor de renderização de PDF.',
      );
    } finally {
      this.isLaunching = false;
    }
  }

  async renderHtmlToPdf(
    html: string,
    options?: PdfRenderOptions,
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 30000,
      });

      // Aguardar fontes carregarem
      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        printBackground: true,
        margin: {
          top: options?.margin?.top || '12mm',
          bottom: options?.margin?.bottom || '12mm',
          left: options?.margin?.left || '14mm',
          right: options?.margin?.right || '14mm',
        },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Erro ao renderizar HTML para PDF:', error);
      throw new InternalServerErrorException(
        'Não foi possível gerar o arquivo PDF a partir do HTML.',
      );
    } finally {
      await context.close().catch(() => {});
    }
  }

  async renderMarkdownToPdf(
    markdown: string,
    options?: PdfRenderOptions,
  ): Promise<Buffer> {
    const htmlBody = this.convertMarkdownToHtml(markdown);
    const fullHtml = this.wrapWithAtsStyles(htmlBody, options?.title);
    return this.renderHtmlToPdf(fullHtml, options);
  }

  private convertMarkdownToHtml(md: string): string {
    const lines = md.split('\n');
    const output: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Trim carriage returns
      line = line.replace(/\r$/, '');

      // Check for bullet lists
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          inList = true;
          output.push('<ul class="ats-list">');
        }
        const text = this.formatInline(listMatch[3]);
        output.push(`  <li>${text}</li>`);
        continue;
      } else if (inList) {
        inList = false;
        output.push('</ul>');
      }

      // Check for horizontal rules
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        output.push('<hr class="ats-divider" />');
        continue;
      }

      // Check for Headers
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        output.push(
          `<h3 class="ats-section-title">${this.formatInline(h3Match[1])}</h3>`,
        );
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        output.push(
          `<h2 class="ats-heading-2">${this.formatInline(h2Match[1])}</h2>`,
        );
        continue;
      }

      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        output.push(
          `<h1 class="ats-heading-1">${this.formatInline(h1Match[1])}</h1>`,
        );
        continue;
      }

      // Check for empty lines
      if (!line.trim()) {
        continue;
      }

      // Raw HTML block or standard paragraph
      if (line.trim().startsWith('<div') || line.trim().startsWith('<p') || line.trim().startsWith('<section')) {
        output.push(this.formatInline(line));
      } else {
        output.push(`<p class="ats-paragraph">${this.formatInline(line)}</p>`);
      }
    }

    if (inList) {
      output.push('</ul>');
    }

    return output.join('\n');
  }

  private formatInline(text: string): string {
    return text
      // Bold + Italic: ***text*** or ___text___
      .replace(/(\*\*\*|___)(.*?)\1/g, '<strong><em>$2</em></strong>')
      // Bold: **text** or __text__
      .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
      // Italic: *text* or _text_
      .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
      // Markdown links: [label](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );
  }

  private wrapWithAtsStyles(content: string, title?: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title || 'Currículo Profissional ATS'}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 12mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 9.75pt;
      line-height: 1.42;
      color: #111827;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    a {
      color: #1d4ed8;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    h1, h2, h3, h4, p, ul {
      margin-top: 0;
    }

    .ats-heading-1 {
      font-size: 1.85em;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }

    .ats-heading-2 {
      font-size: 1.3em;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
    }

    .ats-section-title {
      font-size: 1.05em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3px;
      margin-top: 14px;
      margin-bottom: 7px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .ats-divider {
      border: 0;
      border-top: 1px solid #cbd5e1;
      margin: 10px 0;
    }

    .ats-paragraph {
      margin-bottom: 6px;
      text-align: justify;
      color: #1e293b;
    }

    .ats-list {
      margin-top: 2px;
      margin-bottom: 8px;
      padding-left: 18px;
      color: #1e293b;
    }

    .ats-list li {
      margin-bottom: 4px;
      line-height: 1.38;
    }

    strong {
      font-weight: 600;
      color: #0f172a;
    }

    em {
      font-style: italic;
    }

    /* Proteção contra quebras de página no meio de seções críticas */
    .ats-list li,
    p,
    div {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  }

  async onModuleDestroy() {
    if (this.browserInstance) {
      await this.browserInstance.close().catch(() => {});
      this.browserInstance = null;
    }
  }
}
