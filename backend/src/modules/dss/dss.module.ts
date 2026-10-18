import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DssCalculationEngineService } from './services/dss-calculation-engine.service';
import { AiForecastingClient } from './clients/ai-forecasting.client';
import { GeminiExplainerClient } from './clients/gemini-explainer.client';
import { DssSessionAnalysisService } from './services/dss-session-analysis.service';
import { DssSessionQueryService } from './services/dss-session-query.service';
import { DssItemAdjustmentService } from './services/dss-item-adjustment.service';
import { DssExplainabilityService } from './services/dss-explainability.service';
import { DssApprovalService } from './services/dss-approval.service';
import { DssController } from './dss.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DssController],
  providers: [
    DssCalculationEngineService,
    AiForecastingClient,
    GeminiExplainerClient,
    DssSessionAnalysisService,
    DssSessionQueryService,
    DssItemAdjustmentService,
    DssExplainabilityService,
    DssApprovalService,
  ],
  exports: [
    DssCalculationEngineService,
    AiForecastingClient,
    GeminiExplainerClient,
    DssSessionAnalysisService,
    DssSessionQueryService,
    DssItemAdjustmentService,
    DssExplainabilityService,
    DssApprovalService,
  ],
})
export class DssModule {}
