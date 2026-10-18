import React from 'react';
import { Download, FileSpreadsheet, Loader2, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useDownloadTemplate } from '../hooks/useDataImport';
import type { ImportType } from '../types';

interface TemplateDownloadBannerProps {
  type: ImportType;
}

export const TemplateDownloadBanner: React.FC<TemplateDownloadBannerProps> = ({
  type,
}) => {
  const downloadMutation = useDownloadTemplate();

  const handleDownload = () => {
    downloadMutation.mutate(type);
  };

  const isSales = type === 'sales';

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">
                Biểu Mẫu Tệp Chuẩn ({isSales ? 'sales_template.csv' : 'inventory_template.csv'})
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                UTF-8 CSV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tải biểu mẫu CSV để đối chiếu định dạng cột dữ liệu chuẩn trước khi tải lên hệ thống.
            </p>

            {/* Cột bắt buộc */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Cột bắt buộc:
              </span>
              {isSales ? (
                <>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 font-medium">
                    Date
                  </code>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 font-medium">
                    SKU
                  </code>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 font-medium">
                    Quantity
                  </code>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 font-medium">
                    Revenue
                  </code>
                </>
              ) : (
                <>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-700 font-medium">
                    SKU
                  </code>
                  <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-700 font-medium">
                    StockQuantity
                  </code>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
            className="border-slate-300 hover:bg-white text-slate-700 font-medium shadow-2xs"
          >
            {downloadMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-600" />
                Đang tải mẫu...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Tải Biểu Mẫu Chuẩn
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
