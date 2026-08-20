import { Module } from '@nestjs/common';
import { PDF_RENDERER_TOKEN } from '../../../app/providers/pdf-renderer.interface';
import { PlaywrightPdfRendererService } from './playwright-pdf-renderer.service';

@Module({
  providers: [
    {
      provide: PDF_RENDERER_TOKEN,
      useClass: PlaywrightPdfRendererService,
    },
  ],
  exports: [PDF_RENDERER_TOKEN],
})
export class PdfModule {}
