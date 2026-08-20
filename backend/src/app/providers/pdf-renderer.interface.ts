export const PDF_RENDERER_TOKEN = Symbol('PDF_RENDERER_TOKEN');

export interface PdfRenderOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  title?: string;
}

export interface IPdfRenderer {
  renderHtmlToPdf(html: string, options?: PdfRenderOptions): Promise<Buffer>;
  renderMarkdownToPdf(
    markdown: string,
    options?: PdfRenderOptions,
  ): Promise<Buffer>;
}
