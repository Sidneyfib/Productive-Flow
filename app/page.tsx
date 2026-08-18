'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FlowProvider, useFlow } from '@/context/FlowContext';
import SideNavBar from '@/components/Navbar/SideNavBar';
import TopNavBar from '@/components/Navbar/TopNavBar';
import AuthView from '@/components/Views/AuthView';
import DashboardView from '@/components/Views/DashboardView';
import ProjectsView from '@/components/Views/ProjectsView';
import TasksView from '@/components/Views/TasksView';
import TimerView from '@/components/Views/TimerView';
import HistoryView from '@/components/Views/HistoryView';
import StatsView from '@/components/Views/StatsView';
import ProfileView from '@/components/Views/ProfileView';
import TaskModal from '@/components/Modals/TaskModal';
import ProjectModal from '@/components/Modals/ProjectModal';
import CelebrationModal from '@/components/Modals/CelebrationModal';
import ToastContainer from '@/components/UI/ToastContainer';
import { Timer } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { currentTab } = useFlow();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-xs animate-pulse">
          <Timer className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Carregando Flow...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthView />
        <ToastContainer />
      </>
    );
  }

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'tasks':
        return <TasksView />;
      case 'timer':
        return <TimerView />;
      case 'history':
        return <HistoryView />;
      case 'stats':
        return <StatsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Side Navigation Bar (Desktop) */}
      <SideNavBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto custom-scrollbar">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Modals & Toasts */}
      <TaskModal />
      <ProjectModal />
      <CelebrationModal />
      <ToastContainer />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <FlowProvider>
        <AppContent />
      </FlowProvider>
    </AuthProvider>
  );
}
