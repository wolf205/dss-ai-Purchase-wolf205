import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { UnauthorizedPage } from '../pages/common/UnauthorizedPage';
import { NotFoundPage } from '../pages/common/NotFoundPage';

// Placeholder Pages (Sẵn sàng triển khai 7B)
import { DssPage } from '../pages/placeholders/DssPage';
import { OrdersPage } from '../pages/placeholders/OrdersPage';
import { ReceiptsPage } from '../pages/placeholders/ReceiptsPage';
import { DataImportPage } from '../pages/placeholders/DataImportPage';
import { CatalogPage } from '../pages/placeholders/CatalogPage';
import { SuppliersPage } from '../pages/placeholders/SuppliersPage';
import { ConfigurationPage } from '../pages/placeholders/ConfigurationPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dss" replace />,
      },
      {
        path: 'dss',
        element: <DssPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'receipts',
        element: <ReceiptsPage />,
      },
      {
        path: 'data-import',
        element: <DataImportPage />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'configuration',
        element: (
          <ProtectedRoute allowedRoles={['STORE_MANAGER']}>
            <ConfigurationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
