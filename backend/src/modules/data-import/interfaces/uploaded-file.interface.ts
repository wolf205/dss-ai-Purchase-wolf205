export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface DataImportErrorDetail {
  row: number;
  skuCode?: string;
  issue: string;
}
