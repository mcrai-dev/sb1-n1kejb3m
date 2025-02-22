import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, LogOut, Settings, Home, Building2, Menu, UserPlus, Book, BarChart as ChartBar, Bell, Calendar, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StudentRegistration from './StudentRegistration';
import TeacherManagement from './TeacherManagement';
import SchoolSettings from './SchoolSettings';
import Sidebar from './Sidebar';
import type { Class } from '../types';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 dark:text-gray-500 lg:hidden hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer l'école
        const { data: schoolData } = await supabase
          .from('schools')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (schoolData) {
          // Récupérer les statistiques
          const [
            { count: studentsCount },
            { count: teachersCount },
            { count: classesCount }
          ] = await Promise.all([
            supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('school_id', schoolData.id),
            supabase
              .from('teachers')
              .select('*', { count: 'exact', head: true })
              .eq('school_id', schoolData.id),
            supabase
              .from('classes')
              .select('*', { count: 'exact', head: true })
              .eq('school_id', schoolData.id)
          ]);

          setStats({
            students: studentsCount || 0,
            teachers: teachersCount || 0,
            classes: classesCount || 0,
            pendingTasks: 2 // Exemple statique
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Étudiants</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.students}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Enseignants</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.teachers}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.classes}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <Book className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tâches en attente</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.pendingTasks}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
              <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Panneaux principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestion des étudiants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-800/30">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Gestion des étudiants
                </h3>
              </div>
              <Link
                to="/dashboard/students"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Inscriptions en attente</span>
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">3</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Dernière inscription</span>
                <span className="text-gray-900 dark:text-gray-100">Il y a 2 heures</span>
              </div>

              <Link
                to="/dashboard/students"
                className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <UserPlus className="h-4 w-4" />
                <span>Ajouter un étudiant</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Taux de présence</span>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">95%</span>
                <ChartBar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Gestion des enseignants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-800/30">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Gestion des enseignants
                </h3>
              </div>
              <Link
                to="/dashboard/teachers"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cours aujourd'hui</span>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">12</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Prochain cours</span>
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Clock className="h-4 w-4" />
                  <span>14:30</span>
                </div>
              </div>

              <Link
                to="/dashboard/teachers"
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Calendar className="h-4 w-4" />
                <span>Voir l'emploi du temps</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Statut système</span>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">Opérationnel</span>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/dashboard/settings"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md dark:shadow-gray-800/30 dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Établissement</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gérer les informations</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/settings"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md dark:shadow-gray-800/30 dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Paramètres</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configuration système</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/settings"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md dark:shadow-gray-800/30 dark:hover:shadow-gray-800/50 transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gérer les alertes</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StudentRegistrationWrapper() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolType, setSchoolType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Récupérer l'école
        const { data: schoolData } = await supabase
          .from('schools')
          .select('id, type')
          .eq('user_id', user.id)
          .single();

        if (schoolData) {
          setSchoolType(schoolData.type);

          // Récupérer les classes
          const { data: classesData } = await supabase
            .from('classes')
            .select('*')
            .eq('school_id', schoolData.id)
            .order('name');

          if (classesData) {
            setClasses(classesData.map(c => ({
              id: c.id,
              name: c.name,
              studentCount: c.student_count
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  return (
    <StudentRegistration 
      classes={classes}
      schoolType={schoolType}
    />
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/students" element={<StudentRegistrationWrapper />} />
        <Route path="/teachers" element={<TeacherManagement schoolId="" classes={[]} />} />
        <Route path="/settings" element={<SchoolSettings />} />
      </Routes>
    </DashboardLayout>
  );
}