import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Sparkles, ArrowRight, Building2, Phone, MapPin, GraduationCap, Users, Book, Brain, Bot, Lightbulb, School } from 'lucide-react';
import { signIn, getUserType, AuthType } from './lib/auth';
import { supabase } from './lib/supabase';
import StudentRegistration from './components/StudentRegistration';
import TeacherManagement from './components/TeacherManagement';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import SchoolRegistration from './components/SchoolRegistration';
import type { SchoolInfo } from './types';

type Step = 'login' | 'register';

function AuthLayout() {
  const [currentStep, setCurrentStep] = useState<Step>('login');
  const [authType, setAuthType] = useState<AuthType>('school');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const type = await getUserType();
          if (type) {
            redirectBasedOnType(type);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const redirectBasedOnType = (type: AuthType) => {
    switch (type) {
      case 'student':
        navigate('/student');
        break;
      case 'teacher':
        navigate('/teacher');
        break;
      case 'school':
        navigate('/dashboard');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      const { user, profile, requirePasswordChange } = await signIn(email, password, authType);
      
      if (requirePasswordChange) {
        // Rediriger vers la page de changement de mot de passe
        navigate('/change-password');
      } else {
        redirectBasedOnType(profile.type as AuthType);
      }
    } catch (error: any) {
      console.error('Error during authentication:', error);
      setErrors({
        auth: error.message === 'Invalid login credentials' 
          ? 'Email ou mot de passe incorrect'
          : 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          <div className="md:w-1/3 bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-700 dark:to-indigo-800 p-8 text-white">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Brain className="h-8 w-8" />
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {currentStep === 'login' ? 'Edubot Assistant' : 'Rejoignez Edubot'}
              </h2>
              <p className="text-purple-100 mb-8">
                {currentStep === 'login' 
                  ? 'L\'assistant IA qui s\'adapte à chaque élève pour un apprentissage personnalisé'
                  : 'Créez votre espace et donnez à vos élèves un assistant IA personnalisé'}
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3 text-purple-100">
                  <Lightbulb className="h-5 w-5" />
                  <span>Apprentissage adaptatif</span>
                </div>
                <div className="flex items-center gap-3 text-purple-100">
                  <Book className="h-5 w-5" />
                  <span>Contenus personnalisés</span>
                </div>
                <div className="flex items-center gap-3 text-purple-100">
                  <GraduationCap className="h-5 w-5" />
                  <span>Suivi des progrès</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block mt-8">
              <img 
                src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                alt="Education AI" 
                className="rounded-lg opacity-75 shadow-lg"
              />
            </div>
          </div>

          <div className="md:w-2/3 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
                  <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  {currentStep === 'login' ? 'Connexion' : 'Inscription'}
                </h3>

                {/* Sélecteur de type de compte */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setAuthType('school')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      authType === 'school'
                        ? 'border-purple-600 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-600'
                    }`}
                  >
                    <Building2 className={`h-6 w-6 mx-auto mb-2 ${
                      authType === 'school'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <p className={`text-sm font-medium text-center ${
                      authType === 'school'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Établissement
                    </p>
                  </button>

                  <button
                    onClick={() => setAuthType('teacher')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      authType === 'teacher'
                        ? 'border-purple-600 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-600'
                    }`}
                  >
                    <GraduationCap className={`h-6 w-6 mx-auto mb-2 ${
                      authType === 'teacher'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <p className={`text-sm font-medium text-center ${
                      authType === 'teacher'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Enseignant
                    </p>
                  </button>

                  <button
                    onClick={() => setAuthType('student')}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      authType === 'student'
                        ? 'border-purple-600 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-purple-300 dark:border-gray-700 dark:hover:border-purple-600'
                    }`}
                  >
                    <Users className={`h-6 w-6 mx-auto mb-2 ${
                      authType === 'student'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <p className={`text-sm font-medium text-center ${
                      authType === 'student'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      Étudiant
                    </p>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-gray-100`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pr-10 px-3 py-2 border ${
                        errors.password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-gray-100`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                    Mot de passe oublié ?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : currentStep === 'login' ? (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    <>
                      Activer l'assistant IA
                      <Sparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>

                {errors.auth && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {errors.auth}
                  </div>
                )}

                {authType === 'school' && (
                  <div className="text-center mt-6">
                    {currentStep === 'login' ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pas encore d'assistant IA ?{' '}
                        <button
                          type="button"
                          onClick={() => setCurrentStep('register')}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                        >
                          Activer pour votre établissement
                        </button>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Déjà un compte ?{' '}
                        <button
                          type="button"
                          onClick={() => setCurrentStep('login')}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                        >
                          Se connecter
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthLayout />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/student/*" element={<StudentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;