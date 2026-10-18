import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import {
  useConfiguration,
  useUpdateConfiguration,
  useResetConfiguration,
} from '../hooks/useConfiguration';
import { ConfigurationHeader } from '../components/ConfigurationHeader';
import { WeightSlidersCard } from '../components/WeightSlidersCard';
import { InventoryPolicyCard } from '../components/InventoryPolicyCard';
import { ResetConfirmModal } from '../components/ResetConfirmModal';
import type { DssConfiguration, ConfigurationFormData } from '../types';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ConfigurationFormProps {
  config: DssConfiguration;
  isReadOnly: boolean;
  onSave: (formData: ConfigurationFormData) => Promise<void>;
  onReset: () => Promise<void>;
  isSaving: boolean;
  isResetting: boolean;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  config,
  isReadOnly,
  onSave,
  onReset,
  isSaving,
  isResetting,
}) => {
  const [formData, setFormData] = useState<ConfigurationFormData>(() => ({
    weightPrice: Math.round((config.weightPrice ?? config.priceWeight ?? 0.4) * 100),
    weightLeadTime: Math.round(
      (config.weightLeadTime ?? config.leadTimeWeight ?? 0.2) * 100,
    ),
    weightMoq: Math.round((config.weightMoq ?? config.moqWeight ?? 0.15) * 100),
    weightHistory: Math.round(
      (config.weightHistory ?? config.historyWeight ?? 0.25) * 100,
    ),
    targetServiceLevel: Number(config.targetServiceLevel ?? 0.95),
    reviewPeriodDays: Number(config.reviewPeriodDays ?? 7),
  }));

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Kiểm tra trạng thái đã chỉnh sửa (isDirty)
  const isDirty = useMemo(() => {
    const origPrice = Math.round(
      (config.weightPrice ?? config.priceWeight ?? 0.4) * 100,
    );
    const origLeadTime = Math.round(
      (config.weightLeadTime ?? config.leadTimeWeight ?? 0.2) * 100,
    );
    const origMoq = Math.round((config.weightMoq ?? config.moqWeight ?? 0.15) * 100);
    const origHistory = Math.round(
      (config.weightHistory ?? config.historyWeight ?? 0.25) * 100,
    );
    const origServiceLevel = Number(config.targetServiceLevel ?? 0.95);
    const origReviewPeriod = Number(config.reviewPeriodDays ?? 7);

    return (
      formData.weightPrice !== origPrice ||
      formData.weightLeadTime !== origLeadTime ||
      formData.weightMoq !== origMoq ||
      formData.weightHistory !== origHistory ||
      formData.targetServiceLevel !== origServiceLevel ||
      formData.reviewPeriodDays !== origReviewPeriod
    );
  }, [formData, config]);

  // Kiểm tra tính hợp lệ toàn diện của Form
  const totalWeight =
    formData.weightPrice +
    formData.weightLeadTime +
    formData.weightMoq +
    formData.weightHistory;
  const isWeightValid = totalWeight === 100;
  const isReviewPeriodValid =
    Number.isInteger(formData.reviewPeriodDays) &&
    formData.reviewPeriodDays >= 1 &&
    formData.reviewPeriodDays <= 30;
  const isServiceLevelValid = [0.9, 0.95, 0.98, 0.99].includes(
    formData.targetServiceLevel,
  );

  const isFormValid = isWeightValid && isReviewPeriodValid && isServiceLevelValid;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header with Audit metadata & Save / Reset buttons */}
      <ConfigurationHeader
        updatedBy={config.updatedBy}
        updatedAt={config.updatedAt}
        isReadOnly={isReadOnly}
        isDirty={isDirty}
        isValid={isFormValid}
        isSaving={isSaving}
        onSave={() => void onSave(formData)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      {/* 2. Weight Sliders Card (WSM Engine) */}
      <WeightSlidersCard
        weightPrice={formData.weightPrice}
        weightLeadTime={formData.weightLeadTime}
        weightMoq={formData.weightMoq}
        weightHistory={formData.weightHistory}
        onChange={(weights) => {
          setFormData((prev) => ({
            ...prev,
            ...weights,
          }));
        }}
        isReadOnly={isReadOnly}
      />

      {/* 3. Inventory Policy & Ordering Cycle Card */}
      <InventoryPolicyCard
        targetServiceLevel={formData.targetServiceLevel}
        reviewPeriodDays={formData.reviewPeriodDays}
        onServiceLevelChange={(level) =>
          setFormData((prev) => ({
            ...prev,
            targetServiceLevel: level,
          }))
        }
        onReviewPeriodChange={(days) =>
          setFormData((prev) => ({
            ...prev,
            reviewPeriodDays: days,
          }))
        }
        isReadOnly={isReadOnly}
      />

      {/* 4. Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={async () => {
          await onReset();
          setIsResetModalOpen(false);
        }}
        isLoading={isResetting}
      />
    </div>
  );
};

export const ConfigurationPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = Boolean(user?.role === 'STORE_MANAGER');
  const isReadOnly = !isManager;

  const { data: config, isLoading, isError, error, refetch } = useConfiguration();
  const updateMutation = useUpdateConfiguration();
  const resetMutation = useResetConfiguration();

  // Xử lý lưu cấu hình (STORE_MANAGER)
  const handleSave = async (formData: ConfigurationFormData) => {
    if (isReadOnly || updateMutation.isPending) return;

    await updateMutation.mutateAsync({
      weightPrice: formData.weightPrice / 100,
      weightLeadTime: formData.weightLeadTime / 100,
      weightMoq: formData.weightMoq / 100,
      weightHistory: formData.weightHistory / 100,
      targetServiceLevel: formData.targetServiceLevel,
      reviewPeriodDays: formData.reviewPeriodDays,
    });
  };

  // Xử lý khôi phục mặc định (STORE_MANAGER)
  const handleConfirmReset = async () => {
    if (isReadOnly || resetMutation.isPending) return;
    await resetMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <p className="text-xs text-slate-500 font-medium">
          Đang nạp bộ tham số cấu hình DSS...
        </p>
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-xl border border-rose-200 shadow-xs text-center space-y-4 mt-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Không thể tải cấu hình tham số DSS
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {error?.message || 'Đã xảy ra lỗi khi kết nối với máy chủ.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Thử Lại
        </Button>
      </div>
    );
  }

  return (
    <ConfigurationForm
      key={`${config.id}-${config.updatedAt}`}
      config={config}
      isReadOnly={isReadOnly}
      onSave={handleSave}
      onReset={handleConfirmReset}
      isSaving={updateMutation.isPending}
      isResetting={resetMutation.isPending}
    />
  );
};
