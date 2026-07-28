import { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import CompetitionLists from '@/pages/CompetitionLists';
import ApplicantsList from '@/pages/ApplicantsList';
import Settings from '@/pages/Settings';

function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');

  return (
    <ThemeProvider defaultTheme="light" storageKey="admissions-theme">
      <MainLayout activePage={activePage} setActivePage={setActivePage}>
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'lists' && <CompetitionLists />}
        {activePage === 'applicants' && <ApplicantsList />}
        {activePage === 'settings' && <Settings />}
      </MainLayout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App
