import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import CalendarPage from '../pages/CalendarPage';
import ApplicationPage from '../pages/ApplicationPage';
import ApprovalPage from '../pages/ApprovalPage';
import ExecutionPage from '../pages/ExecutionPage';
import SafetyPage from '../pages/SafetyPage';
import ChangePage from '../pages/ChangePage';
import ArchivePage from '../pages/ArchivePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: 'application', element: <ApplicationPage /> },
      { path: 'approval', element: <ApprovalPage /> },
      { path: 'execution', element: <ExecutionPage /> },
      { path: 'safety', element: <SafetyPage /> },
      { path: 'change', element: <ChangePage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
