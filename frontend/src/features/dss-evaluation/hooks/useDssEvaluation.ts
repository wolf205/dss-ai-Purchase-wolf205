import { useQuery } from '@tanstack/react-query';
import { evaluationService } from '../services/evaluation.service';

export const EVALUATION_KEYS = {
  all: ['dss-evaluation'] as const,
  sessions: ['dss-evaluation', 'sessions'] as const,
  sessionEvaluation: (sessionId: string | number) =>
    ['dss-evaluation', 'session', String(sessionId)] as const,
};

/**
 * Hook tải danh sách toàn bộ các phiên đề xuất DSS
 */
export function useDssSessions() {
  return useQuery({
    queryKey: EVALUATION_KEYS.sessions,
    queryFn: () => evaluationService.getAllSessions(),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook tải kết quả đối soát độ chính xác của phiên DSS được chọn
 */
export function useDssSessionEvaluation(
  sessionId: string | number | null | undefined,
) {
  return useQuery({
    queryKey: EVALUATION_KEYS.sessionEvaluation(sessionId ?? ''),
    queryFn: () => evaluationService.getSessionEvaluation(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 30 * 1000,
  });
}

