import React from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { MenuManager } from './components/admin/MenuManager';
import { AIScriptEditor } from './components/admin/AIScriptEditor';
import { ConversationLog } from './components/admin/ConversationLog';
import { QRGenerator } from './components/admin/QRGenerator';

export const adminRoutes = [
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <MenuManager /> },
      { path: 'menu', element: <MenuManager /> },
      { path: 'ai-script', element: <AIScriptEditor /> },
      { path: 'conversations', element: <ConversationLog /> },
      { path: 'qr', element: <QRGenerator /> },
    ],
  },
];
