import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { User, Book, GraduationCap, LogOut, Settings, Menu, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Student, Class, Course, Subject } from '../types';
import Sidebar from './Sidebar';

interface StudentProfile extends Student {
  class: Class;
  courses: (Course & { subject: Subject })[];
}

function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
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

function StudentHome() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Utilisateur non authentifié');
          return;
        }

        // Récupérer le profil étudiant avec sa classe et ses cours
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            *,
            class:classes (
              id,
              name,
              student_count
            ),
            courses (
              id,
              name,
              description,
              subject:subjects (
                id,
                name,
                description
              ),
              teacher:teachers (
                id,
                first_name,
                last_name
              )
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (studentError) throw studentError;

        setProfile(studentData);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">
        {error || 'Profil non trouvé'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profil */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Mon Profil
          </h2>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nom</p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{profile.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prénom</p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{profile.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">N° Immatriculation</p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{profile.registrationNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classe */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Ma Classe
          </h2>
        </div>
        <div className="panel-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Classe</p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{profile.class.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Effectif</p>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{profile.class.student_count} étudiants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cours */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Book className="h-6 w-6 text-green-600 dark:text-green-400" />
            Mes Cours
          </h2>
        </div>
        <div className="panel-body">
          <div className="space-y-4">
            {profile.courses.map((course) => (
              <div key={course.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{course.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{course.subject.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enseignant</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {course.teacher.first_name} {course.teacher.last_name}
                    </p>
                  </div>
                </div>
                {course.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{course.description}</p>
                )}
              </div>
            ))}

            {profile.courses.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucun cours n'est assigné pour le moment
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <StudentDashboardLayout>
      <Routes>
        <Route path="/" element={<StudentHome />} />
      </Routes>
    </StudentDashboardLayout>
  );
}