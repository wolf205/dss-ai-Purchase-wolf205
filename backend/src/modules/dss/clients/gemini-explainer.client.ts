import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecommendationExplanationContext } from '../interfaces/explanation-context.interface';

@Injectable()
export class GeminiExplainerClient {
  private readonly logger = new Logger(GeminiExplainerClient.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sinh đoạn giải thích lý do mua hàng tự nhiên On-demand bằng Google Gemini 1.5 Flash
   * Kèm cơ chế Graceful Deterministic Fallback khi API Key trống hoặc dịch vụ timeout > 3s
   */
  async explainRecommendation(
    context: RecommendationExplanationContext,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey || apiKey.trim() === '') {
      this.logger.debug(
        'GEMINI_API_KEY chưa được cấu hình. Sử dụng giải thích tất định dự phòng.',
      );
      return this.generateDeterministicFallback(context);
    }

    const primaryModel =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-3.8-flash';
    const modelsToTry = [
      primaryModel,
      ...(primaryModel !== 'gemini-3.5-flash' ? ['gemini-3.5-flash'] : []),
    ];
    const timeoutMs =
      Number(this.configService.get<string>('GEMINI_TIMEOUT_MS')) || 10000;

    const prompt = this.buildPrompt(context);

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 500,
              thinkingConfig: {
                thinkingBudget: 0,
              },
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            candidates?: {
              content?: {
                parts?: { text?: string }[];
              };
            }[];
          };

          const parts = data?.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find(
            (p) =>
              p.text && typeof p.text === 'string' && p.text.trim().length > 0,
          );
          const generatedText = textPart?.text;
          if (
            generatedText &&
            typeof generatedText === 'string' &&
            generatedText.trim().length > 0
          ) {
            return generatedText.trim();
          }
        } else {
          this.logger.warn(
            `Gemini API (${model}) trả về mã lỗi HTTP ${response.status}.`,
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Gemini API (${model}) không phản hồi hoặc timeout: ${message}.`,
        );
      }
    }

    this.logger.warn('Sử dụng giải thích tất định dự phòng.');
    return this.generateDeterministicFallback(context);
  }

  /**
   * Sinh văn bản giải thích tất định (Deterministic Template) khi Gemini không khả dụng
   */
  public generateDeterministicFallback(
    context: RecommendationExplanationContext,
  ): string {
    let riskDesc = `tiệm cận điểm đặt hàng lại ROP (${context.reorderPoint} ${context.unit})`;
    if (context.stockRiskStatus === 'Critical') {
      riskDesc = 'ở mức cạn kiệt nghiêm trọng, tiềm ẩn rủi ro đứt hàng cao';
    } else if (context.stockRiskStatus === 'Warning') {
      riskDesc = `đã rơi xuống dưới mức điểm đặt hàng lại ROP (${context.reorderPoint} ${context.unit})`;
    } else if (context.stockRiskStatus === 'Overstock') {
      riskDesc = 'đang ở mức dư thừa so với nhu cầu chu kỳ';
    }

    const supplierDesc =
      context.wsmScore !== null
        ? `do đạt điểm tổng hợp WSM cao nhất (${context.wsmScore.toFixed(1)}/100)`
        : `với thời gian giao hàng cam kết ${context.leadTimeDays} ngày`;

    return `Mặt hàng ${context.productName} (${context.skuCode}) thuộc nhóm ${context.abcXyzBadge}. Tồn khả dụng hiện tại (${context.currentInventory} ${context.unit}) ${riskDesc}. Hệ thống đề xuất đặt mua ${context.suggestedQuantity} ${context.unit} từ ${context.supplierName} ${supplierDesc} để đảm bảo lượng tồn kho an toàn ${context.safetyStock} ${context.unit}.`;
  }

  /**
   * Soạn prompt ngắn gọn, chuẩn xác cho Gemini 1.5 Flash
   */
  private buildPrompt(context: RecommendationExplanationContext): string {
    return `Bạn là trợ lý AI chuyên gia phân tích thu mua bán lẻ của hệ thống DSS.
Hãy giải thích ngắn gọn, súc tích (khoảng 2 đến 3 câu tiếng Việt tự nhiên) lý do vì sao người quản lý nên đặt mua mặt hàng sau:
- Mặt hàng: ${context.productName} (Mã SKU: ${context.skuCode}, Ngành: ${context.categoryName})
- Phân nhóm ABC-XYZ: ${context.abcXyzBadge}
- Tồn kho hiện có: ${context.currentInventory} ${context.unit}, Hàng đang về: ${context.onOrderQuantity} ${context.unit}
- Điểm đặt hàng lại (ROP): ${context.reorderPoint} ${context.unit}, Tồn kho an toàn (SS): ${context.safetyStock} ${context.unit}
- Mức độ rủi ro tồn kho: ${context.stockRiskStatus}
- Số lượng hệ thống đề xuất mua: ${context.suggestedQuantity} ${context.unit}
- Nhà cung cấp đề xuất: ${context.supplierName} (Điểm WSM: ${context.wsmScore ?? 'N/A'}, Đơn giá: ${context.purchasePrice} đ, Lead time: ${context.leadTimeDays} ngày, MOQ: ${context.moq} ${context.unit})

Yêu cầu: Nêu bật tính cấp thiết của tồn kho và ưu thế của nhà cung cấp được lựa chọn. Tuyệt đối không thêm tiền tố mở đầu như "Dưới đây là..." hay markdown tiêu đề, trả lời trực diện nội dung.`;
  }
}
