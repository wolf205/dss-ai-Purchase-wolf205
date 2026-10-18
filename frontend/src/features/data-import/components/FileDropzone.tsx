import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Trash2,
  AlertCircle,
  FileText,
  SearchCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface FileDropzoneProps {
  selectedFile: File | null;
  onSelectFile: (file: File) => void;
  onClearFile: () => void;
  onValidate: () => void;
  isValidating: boolean;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  selectedFile,
  onSelectFile,
  onClearFile,
  onValidate,
  isValidating,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = (file: File) => {
    setLocalError(null);

    // Kiểm tra đuôi file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setLocalError(
        'Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp định dạng .csv.'
      );
      return;
    }

    // Kiểm tra dung lượng (giới hạn an toàn 10MB)
    if (file.size === 0) {
      setLocalError('Tệp tải lên bị rỗng (0 bytes). Vui lòng kiểm tra lại.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLocalError(
        'Dung lượng tệp vượt quá giới hạn 10MB. Vui lòng chia nhỏ tệp dữ liệu.'
      );
      return;
    }

    onSelectFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isValidating) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isValidating) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
    // Reset input value để có thể chọn lại cùng một file nếu vừa xóa
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        disabled={disabled || isValidating}
        onChange={handleFileInputChange}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isValidating) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/60 scale-[1.005]'
              : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">
            Kéo thả tệp CSV vào đây hoặc{' '}
            <span className="text-blue-600 underline underline-offset-2">
              chọn từ thiết bị
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Chỉ hỗ trợ tệp định dạng .csv chuẩn UTF-8, dung lượng tối đa 10MB.
            Tệp sẽ được kiểm tra tự động theo nguyên tắc All-or-Nothing.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 truncate max-w-xs md:max-w-md">
                    {selectedFile.name}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    Sẵn sàng thẩm định
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Dung lượng: {formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    CSV File
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFile}
                disabled={isValidating || disabled}
                className="text-slate-600 hover:text-red-600 hover:border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Chọn tệp khác
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onValidate}
                disabled={isValidating || disabled}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Đang thẩm định 100%...
                  </>
                ) : (
                  <>
                    <SearchCheck className="w-3.5 h-3.5 mr-1.5" />
                    Kiểm Tra Tính Toàn Vẹn
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị lỗi cục bộ client-side (định dạng, kích thước) */}
      {localError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
};
