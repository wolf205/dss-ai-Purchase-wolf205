---
name: frontend
description: >-
  Hướng dẫn lập trình React+Vite SPA: tạo feature mới, viết components, hooks, services.
  Bao gồm TanStack Query (useQuery, useMutation, cache invalidation), AuthContext, ProtectedRoute,
  Axios interceptor tự động refresh token, Recharts time-series chart với forecast bands CI 95%,
  Badge ABC-XYZ, Supplier Ranking modal, file drag-drop upload. Sử dụng khi implement
  bất kỳ feature frontend nào trong thư mục frontend/src/.
---

# Frontend Skill — React + Vite SPA

## 1. Feature-Driven Directory Map (7 Use Cases)

```
frontend/src/
├── features/
│   ├── auth/           # Login, AuthContext (accessToken in memory), ProtectedRoute
│   ├── dss-review/     # UC-01: Bảng đề xuất, Badge ABC-XYZ, Modal Explain (LLM), Recharts
│   ├── orders/         # UC-02: Danh sách PO, Modal Hủy PO (+ cancellationReason), Export PDF/Excel
│   ├── receipts/       # UC-03: Chọn PO Approved, nhập receivedQuantity, soft warning over-delivery
│   ├── data-import/    # UC-04: Drag-drop file CSV/Excel, Data Preview, Error details table
│   ├── catalog/        # UC-05: Danh mục SKU + Category, CRUD (MANAGER), Read-only (STAFF)
│   ├── suppliers/      # UC-06: Hồ sơ NCC, Conditions (Giá/MOQ), OTIF 5-order badge
│   └── configuration/  # UC-07: Weight sliders (tổng 100%), Service Level radio, Review Period
├── components/         # UI primitives: Button, Table, Modal, Badge, Toast, Input, Pagination
├── services/api/
│   ├── axios.client.ts # Axios instance + Interceptor auto Refresh Token
│   └── endpoints/      # API call functions theo feature
├── hooks/              # Custom hooks (useAuth, useDssSession, useProducts, useSuppliers...)
└── main.tsx
```

Cấu trúc bên trong mỗi feature:
```
features/<name>/
├── components/   # UI components của feature
├── hooks/        # useQuery, useMutation hooks
├── services/     # API call functions (gọi axios.client)
├── types.ts      # TypeScript types/interfaces
└── index.tsx     # Entry point (routes, layout)
```

## 2. TanStack Query Pattern

```typescript
// hooks/useProducts.ts
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

## 3. AuthContext + ProtectedRoute

```typescript
// Lưu accessToken trong MEMORY — tuyệt đối không localStorage/sessionStorage
interface AuthContextValue {
  user: { id: number; username: string; role: 'STORE_MANAGER' | 'PURCHASING_STAFF' } | null;
  accessToken: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
}

// ProtectedRoute — kiểm tra role
export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/unauthorized" />;
  return <>{children}</>;
}
```

## 4. Axios Interceptor (Auto Refresh Token)

```typescript
// services/api/axios.client.ts
const apiClient = axios.create({ baseURL: '/api/v1', withCredentials: true });

apiClient.interceptors.request.use((config) => {
  const token = getAccessTokenFromMemory();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken(); // POST /auth/refresh (dùng HttpOnly cookie)
      setAccessTokenInMemory(newToken);
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

## 5. UC-01 DSS Chart — Recharts Time-Series + Forecast Band CI 95%

```tsx
// Lịch sử bán thực tế (actual) + 14 ngày dự báo (forecast) + dải CI 95%
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={chartData}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    {/* Dải tin cậy 95% */}
    <Area type="monotone" dataKey="ciBand" fill="#3b82f620" stroke="none" name="CI 95%" />
    {/* Bán thực tế (quá khứ) */}
    <Line type="monotone" dataKey="actualSales" stroke="#3b82f6" dot={false} strokeWidth={2} name="Thực tế" />
    {/* Dự báo 14 ngày */}
    <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Dự báo" />
  </ComposedChart>
</ResponsiveContainer>
```

## 6. UC-07 Weight Slider (Tổng 100%)

```tsx
// Validation: sum(weightPrice + weightLeadTime + weightMoq + weightHistory) === 1.0 (±0.001)
const totalWeight = weightPrice + weightLeadTime + weightMoq + weightHistory;
const isValid = Math.abs(totalWeight - 1.0) <= 0.001;
// Hiển thị error nếu tổng ≠ 100% trước khi submit
```

## 7. Common Commands

```bash
# Trong thư mục frontend/
npm run dev          # Dev server (Port 5173)
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```
