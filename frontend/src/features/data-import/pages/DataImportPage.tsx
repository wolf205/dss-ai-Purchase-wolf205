import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
} from 'lucide-react';
import { ImportTypeTabs } from '../components/ImportTypeTabs';
import { TemplateDownloadBanner } from '../components/TemplateDownloadBanner';
import { FileDropzone } from '../components/FileDropzone';
import { ImportPreviewTable } from '../components/ImportPreviewTable';
import { ImportErrorTable } from '../components/ImportErrorTable';
import { ImportConfirmModal } from '../components/ImportConfirmModal';
import { ImportResultCard } from '../components/ImportResultCard';
import {
  useValidateSales,
  useConfirmSales,
  useValidateInventory,
  useConfirmInventory,
  extractImportError,
} from '../hooks/useDataImport';
import type {
  ImportType,
  WorkflowStep,
  SalesValidateResponse,
  InventoryValidateResponse,
  SalesConfirmResponse,
  InventoryConfirmResponse,
  ImportValidationErrorPayload,
} from '../types';

export const DataImportPage: React.FC = () => {
  const [activeType, setActiveType] = useState<ImportType>('sales');
  const [step, setStep] = useState<WorkflowStep>('upload');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [salesPreview, setSalesPreview] = useState<SalesValidateResponse | null>(null);
  const [inventoryPreview, setInventoryPreview] = useState<InventoryValidateResponse | null>(null);
  const [errorData, setErrorData] = useState<ImportValidationErrorPayload | null>(null);

  const [salesResult, setSalesResult] = useState<SalesConfirmResponse | null>(null);
  const [inventoryResult, setInventoryResult] = useState<InventoryConfirmResponse | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // TanStack Query Mutations
  const validateSalesMutation = useValidateSales();
  const confirmSalesMutation = useConfirmSales();
  const validateInventoryMutation = useValidateInventory();
  const confirmInventoryMutation = useConfirmInventory();

  const isValidating =
    validateSalesMutation.isPending || validateInventoryMutation.isPending;
  const isConfirming =
    confirmSalesMutation.isPending || confirmInventoryMutation.isPending;

  // Chuyển đổi loại nhập liệu
  const handleChangeType = (type: ImportType) => {
    if (isValidating || isConfirming) return;
    setActiveType(type);
    handleResetAll();
  };

  // Reset toàn bộ trạng thái về ban đầu
  const handleResetAll = () => {
    setSelectedFile(null);
    setSalesPreview(null);
    setInventoryPreview(null);
    setErrorData(null);
    setSalesResult(null);
    setInventoryResult(null);
    setStep('upload');
  };

  // Kích hoạt thẩm định tệp CSV
  const handleValidate = () => {
    if (!selectedFile) return;

    if (activeType === 'sales') {
      validateSalesMutation.mutate(selectedFile, {
        onSuccess: (data) => {
          setSalesPreview(data);
          setErrorData(null);
          setStep('preview');
        },
        onError: (err) => {
          const parsed = extractImportError(err);
          setErrorData(parsed);
          setSalesPreview(null);
          setStep('error');
        },
      });
    } else {
      validateInventoryMutation.mutate(selectedFile, {
        onSuccess: (data) => {
          setInventoryPreview(data);
          setErrorData(null);
          setStep('preview');
        },
        onError: (err) => {
          const parsed = extractImportError(err);
          setErrorData(parsed);
          setInventoryPreview(null);
          setStep('error');
        },
      });
    }
  };

  // Mở modal xác nhận nạp
  const handleOpenConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  // Thực thi nạp dữ liệu chính thức vào CSDL
  const handleExecuteConfirm = () => {
    if (!selectedFile) return;

    if (activeType === 'sales') {
      confirmSalesMutation.mutate(selectedFile, {
        onSuccess: (data) => {
          setSalesResult(data);
          setIsConfirmModalOpen(false);
          setStep('success');
        },
      });
    } else {
      confirmInventoryMutation.mutate(selectedFile, {
        onSuccess: (data) => {
          setInventoryResult(data);
          setIsConfirmModalOpen(false);
          setStep('success');
        },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              Operational Data Ingestion (UC-04)
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Nhập Dữ Liệu Bán Hàng & Tồn Kho Thực Tế
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Tiếp nhận dữ liệu lịch sử doanh số bán hàng để làm giàu mô hình AI dự báo nhu cầu (UC-01) 
              và làm mới số lượng kiểm kê trên kệ theo nguyên tắc toàn vẹn <strong>All-or-Nothing (BR-14)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              All-or-Nothing Active
            </span>
          </div>
        </div>

        {/* Thanh Quy Trình Các Bước */}
        <div className="grid grid-cols-4 gap-2 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              1
            </span>
            <span className="font-semibold text-slate-800 hidden sm:inline">
              Chọn Loại & Tệp
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                isValidating
                  ? 'bg-blue-600 text-white animate-pulse'
                  : step === 'preview' || step === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : step === 'error'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              2
            </span>
            <span className="font-medium text-slate-600 hidden sm:inline">
              Thẩm Định 100%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'preview'
                  ? 'bg-blue-600 text-white'
                  : step === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              3
            </span>
            <span className="font-medium text-slate-600 hidden sm:inline">
              Xem Trước Dữ Liệu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              4
            </span>
            <span className="font-medium text-slate-600 hidden sm:inline">
              Lưu Vào CSDL
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tabs Chọn Phân Hệ (Sales vs Inventory) */}
      <ImportTypeTabs
        activeType={activeType}
        onChangeType={handleChangeType}
        disabled={isValidating || isConfirming || step === 'preview' || step === 'error'}
      />

      {/* 3. Nội dung điều phối theo Workflow Step */}
      {step === 'upload' && (
        <div className="space-y-5 animate-toast-enter">
          {/* Tải Biểu Mẫu Chuẩn */}
          <TemplateDownloadBanner type={activeType} />

          {/* Kéo thả hoặc chọn tệp */}
          <FileDropzone
            selectedFile={selectedFile}
            onSelectFile={(file) => setSelectedFile(file)}
            onClearFile={() => setSelectedFile(null)}
            onValidate={handleValidate}
            isValidating={isValidating}
          />
        </div>
      )}

      {step === 'preview' && (
        <ImportPreviewTable
          type={activeType}
          salesData={salesPreview}
          inventoryData={inventoryPreview}
          onConfirm={handleOpenConfirmModal}
          onReset={handleResetAll}
          isConfirming={isConfirming}
        />
      )}

      {step === 'error' && errorData && (
        <ImportErrorTable
          type={activeType}
          errors={errorData.details}
          message={errorData.message}
          onReset={handleResetAll}
        />
      )}

      {step === 'success' && (
        <ImportResultCard
          type={activeType}
          salesResult={salesResult}
          inventoryResult={inventoryResult}
          onReset={handleResetAll}
        />
      )}

      {/* 4. Modal xác nhận ghi đè / nạp dữ liệu */}
      <ImportConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteConfirm}
        type={activeType}
        totalRows={
          activeType === 'sales'
            ? salesPreview?.totalRows || 0
            : inventoryPreview?.totalRows || 0
        }
        duplicateDates={salesPreview?.duplicateDatesFound || []}
        isConfirming={isConfirming}
      />
    </div>
  );
};
