import { PoExportData, PurchaseOrderWithRelations } from '../interfaces/purchase-order.interface';

export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' đ';
}

export function formatDateVN(dateInput: Date | string): string {
  const date = new Date(dateInput);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Xuất đơn mua hàng định dạng CSV/Spreadsheet chuẩn UTF-8 BOM,
 * tương thích 100% với Microsoft Excel và Google Sheets.
 */
export function exportPoToCsv(po: PurchaseOrderWithRelations): PoExportData {
  const bom = '\uFEFF';
  const lines: string[] = [];

  lines.push('ĐƠN MUA HÀNG (PURCHASE ORDER)');
  lines.push(`Mã đơn PO,${po.poNumber}`);
  lines.push(`Trạng thái,${po.status}`);
  lines.push(`Ngày duyệt đơn,${formatDateVN(po.approvalDate)}`);
  lines.push(`Ngày giao dự kiến,${formatDateVN(po.expectedDeliveryDate)}`);
  lines.push(`Nhà cung cấp,${po.supplier.supplierName} (${po.supplier.supplierCode})`);
  lines.push(`Người liên hệ,${po.supplier.contactPerson || 'Chưa cập nhật'}`);
  lines.push(`Số điện thoại,${po.supplier.phoneNumber || 'Chưa cập nhật'}`);
  lines.push(`Email,${po.supplier.email || 'Chưa cập nhật'}`);
  lines.push(`Địa chỉ,${(po.supplier.address || 'Chưa cập nhật').replace(/,/g, ' ')}`);
  lines.push('');
  lines.push('STT,Mã SKU,Tên sản phẩm,Đơn vị tính,Số lượng,Đơn giá cam kết (VNĐ),Thành tiền (VNĐ)');

  let totalAmount = 0;
  po.lineItems.forEach((item, idx) => {
    const qty = item.quantity;
    const price = Number(item.historicalUnitPrice);
    const lineTotal = Number(item.lineTotal ?? qty * price);
    totalAmount += lineTotal;

    const prodName = item.product.productName.replace(/,/g, ' ');
    lines.push(
      `${idx + 1},${item.product.skuCode},"${prodName}",${item.product.unit},${qty},${price},${lineTotal}`,
    );
  });

  lines.push('');
  lines.push(`,,,,Tổng cộng,,${totalAmount}`);

  const csvContent = bom + lines.join('\r\n');
  const buffer = Buffer.from(csvContent, 'utf-8');

  return {
    buffer,
    mimeType: 'text/csv; charset=utf-8',
    fileName: `${po.poNumber}.csv`,
  };
}

/**
 * Xuất đơn mua hàng định dạng HTML In ấn / Báo giá chuyên nghiệp (Printable Voucher),
 * tích hợp sẵn CSS Media Print, Layout phong cách DSS hiện đại.
 */
export function exportPoToHtmlPrint(po: PurchaseOrderWithRelations): PoExportData {
  let totalAmount = 0;
  const rowsHtml = po.lineItems
    .map((item, idx) => {
      const qty = item.quantity;
      const price = Number(item.historicalUnitPrice);
      const lineTotal = Number(item.lineTotal ?? qty * price);
      totalAmount += lineTotal;

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${item.product.skuCode}</strong></td>
          <td>${item.product.productName}</td>
          <td style="text-align: center;">${item.product.unit}</td>
          <td style="text-align: right; font-weight: bold;">${qty}</td>
          <td style="text-align: right;">${formatCurrencyVND(price)}</td>
          <td style="text-align: right; font-weight: bold;">${formatCurrencyVND(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Đơn mua hàng - ${po.poNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      color: #333;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .store-title {
      font-size: 22px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .po-title {
      font-size: 26px;
      font-weight: bold;
      color: #2563eb;
      text-align: right;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 600;
      text-align: left;
    }
    .total-box {
      text-align: right;
      font-size: 18px;
      margin-bottom: 40px;
    }
    .total-amount {
      font-size: 22px;
      font-weight: bold;
      color: #dc2626;
      margin-left: 10px;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 50px;
      text-align: center;
    }
    .sign-box {
      width: 200px;
    }
    .sign-title {
      font-weight: bold;
      margin-bottom: 70px;
    }
    @media print {
      body { margin: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-title">HỆ THỐNG QUẢN LÝ BÁN LẺ & THỰC PHẨM (DSS)</div>
      <div>Địa chỉ: Cửa hàng Bán lẻ Độc lập, Hà Nội</div>
      <div>Hotline: 1900-8888 | Email: purchasing@retail-dss.vn</div>
    </div>
    <div>
      <div class="po-title">ĐƠN MUA HÀNG</div>
      <div><strong>Mã PO:</strong> ${po.poNumber}</div>
      <div><strong>Trạng thái:</strong> ${po.status}</div>
    </div>
  </div>

  <div class="grid-info">
    <div>
      <h4 style="margin: 0 0 10px 0; color: #1e3a8a;">ĐƠN VỊ CUNG ỨNG:</h4>
      <div><strong>${po.supplier.supplierName}</strong> (${po.supplier.supplierCode})</div>
      <div>Người liên hệ: ${po.supplier.contactPerson || 'Chưa cập nhật'}</div>
      <div>Điện thoại: ${po.supplier.phoneNumber || 'Chưa cập nhật'}</div>
      <div>Email: ${po.supplier.email || 'Chưa cập nhật'}</div>
      <div>Địa chỉ: ${po.supplier.address || 'Chưa cập nhật'}</div>
    </div>
    <div>
      <h4 style="margin: 0 0 10px 0; color: #1e3a8a;">THÔNG TIN ĐƠN HÀNG:</h4>
      <div>Ngày phê duyệt: <strong>${formatDateVN(po.approvalDate)}</strong></div>
      <div>Ngày giao dự kiến: <strong>${formatDateVN(po.expectedDeliveryDate)}</strong></div>
      <div>Thời gian giao cam kết: ${po.historicalLeadTimeDays} ngày</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50px; text-align: center;">STT</th>
        <th style="width: 140px;">Mã SKU</th>
        <th>Tên Mặt Hàng</th>
        <th style="width: 80px; text-align: center;">ĐVT</th>
        <th style="width: 100px; text-align: right;">Số Lượng</th>
        <th style="width: 140px; text-align: right;">Đơn Giá Cam Kết</th>
        <th style="width: 160px; text-align: right;">Thành Tiền</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="total-box">
    <span>TỔNG CỘNG TIỀN THANH TOÁN:</span>
    <span class="total-amount">${formatCurrencyVND(totalAmount)}</span>
  </div>

  <div class="signatures">
    <div class="sign-box">
      <div class="sign-title">ĐẠI DIỆN NHÀ CUNG CẤP</div>
      <div>(Ký và ghi rõ họ tên)</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">NHÂN VIÊN MUA HÀNG</div>
      <div>(Ký và ghi rõ họ tên)</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">QUẢN LÝ CỬA HÀNG DUYỆT</div>
      <div>(Ký và đóng dấu)</div>
    </div>
  </div>
</body>
</html>`;

  return {
    buffer: Buffer.from(htmlContent, 'utf-8'),
    mimeType: 'text/html; charset=utf-8',
    fileName: `${po.poNumber}.html`,
  };
}

export function exportPurchaseOrder(
  po: PurchaseOrderWithRelations,
  format: 'pdf' | 'excel' = 'pdf',
): PoExportData {
  if (format === 'excel') {
    return exportPoToCsv(po);
  }
  return exportPoToHtmlPrint(po);
}
