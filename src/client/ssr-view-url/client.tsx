import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-datatable/styles.css';

import NodeCastSSRProvider from '@/components/NodeCastSSRProvider';
import { NODECAST_SSR_PROP } from '@/lib/ssr/constants';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { createRoutes } from './routes';

const router = createBrowserRouter(createRoutes());

const initialData = (window as any)[NODECAST_SSR_PROP];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NodeCastSSRProvider ssrData={initialData}>
      <RouterProvider router={router} />
    </NodeCastSSRProvider>
  </StrictMode>,
);
