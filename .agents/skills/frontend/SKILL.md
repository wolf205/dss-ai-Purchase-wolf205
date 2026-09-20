---
name: frontend
description: >-
  Hướng dẫn lập trình React+Vite SPA: tạo feature mới, viết components, hooks, services.
  Bao gồm TanStack Query (useQuery, useMutation, cache invalidation), AuthContext, ProtectedRoute,
  Axios interceptor tự động refresh token, Recharts time-series chart với forecast bands.
  Sử dụng khi implement bất kỳ feature frontend nào trong thư mục frontend/src/.
---

# Frontend Skill — React + Vite SPA

## 1. Feature-Driven Directory Map

```
frontend/src/
├── components/              # UI Primitives dùng chung
│   ├── Button/
│   ├── Table/
│   ├── Modal/
│   ├── Badge/
│   └── Toast/
├── features/                # 7 Use Cases — mỗi feature là một thư mục
│   ├── auth/                # Login page, AuthContext, ProtectedRoute
│   ├── dss-review/          # UC-01: Recommendation table, Explain modal, Recharts
│   ├── orders/              # UC-02: PO List, Cancel PO
│   ├── receipts/            # UC-03: Goods receipt form, Over-delivery warning
│   ├── data-import/         # UC-04: File drag-drop, Error details table
│   ├── catalog/             # UC-05: Product/Category CRUD
│   ├── suppliers/           # UC-06: Supplier list, OTIF 5-order badge
│   └── config/              # UC-07: DSS weights slider, Service Level input
├── services/
│   └── api/
│       ├── axios.client.ts  # Axios instance + Interceptors
│       └── endpoints/       # API call functions theo feature
├── hooks/                   # TanStack Query custom hooks
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct } from '../services/productsApi';

// Query (GET)
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

// Mutation (POST/PUT/DELETE) + cache invalidation
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
// features/auth/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;  // Lưu trong memory — không localStorage
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
}

// features/auth/ProtectedRoute.tsx
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

// Request interceptor: gắn Access Token
apiClient.interceptors.request.use((config) => {
  const token = getAccessTokenFromMemory();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto refresh khi 401
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

## 5. Recharts Time-Series Template (UC-01 DSS Chart)

```tsx
// Biểu đồ: Đường bán thực tế + Đường dự báo + Vùng CI 95%
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={chartData}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    {/* Vùng CI 95% */}
    <Area type="monotone" dataKey="ci_band" fill="#3b82f620" stroke="none" />
    {/* Đường bán thực tế (quá khứ) */}
    <Line type="monotone" dataKey="actual_sales" stroke="#3b82f6" dot={false} strokeWidth={2} />
    {/* Đường dự báo (tương lai 14 ngày) */}
    <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
  </ComposedChart>
</ResponsiveContainer>
```

## 6. Common Commands

```bash
# Trong thư mục frontend/
npm run dev          # Dev server (Port 5173)
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```
