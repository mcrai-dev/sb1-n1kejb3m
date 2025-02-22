import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, School, Phone, Mail, MapPin, GraduationCap,
  Save, Plus, Trash2, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import type { SchoolInfo, Class } from '../types';
import { supabase } from '../lib/supabase';

export default function SchoolSettings() {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: any}>({});
  const navigate = useNavigate();

  // Vérifier la connexion à Supabase
  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Veuillez vous connecter pour accéder à cette page');
        setIsOnline(false);
        return false;
      }

      const { error } = await supabase.from('schools').select('count');
      setIsOnline(!error);
      return !error;
    } catch {
      setIsOnline(false);
      return false;
    }
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const isConnected = await checkConnection();
        if (!isConnected) {
          setIsLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Utilisateur non authentifié');
          setIsLoading(false);
          return;
        }

        // Récupérer les informations de l'établissement
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (schoolError) throw schoolError;

        // Récupérer les classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', schoolData.id)
          .order('name');

        if (classesError) throw classesError;

        setSchoolInfo({
          name: schoolData.name,
          type: schoolData.type,
          email: schoolData.email,
          password: '', // Le mot de passe n'est jamais renvoyé
          phone: schoolData.phone,
          address: schoolData.address,
          city: schoolData.city,
          postalCode: schoolData.postal_code,
          directorName: schoolData.director_name,
          classes: [],
          aiPreferences: schoolData.ai_preferences
        });

        setClasses(classesData.map(c => ({
          id: c.id,
          name: c.name,
          studentCount: c.student_count
        })));

        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching school data:', err);
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
      }
    };

    fetchSchoolData();

    const connectionInterval = setInterval(checkConnection, 30000);
    return () => clearInterval(connectionInterval);
  }, []);

  const handleInputChange = (field: keyof SchoolInfo, value: any) => {
    if (pendingChanges[field]?.timer) {
      clearTimeout(pendingChanges[field].timer);
    }

    const timer = setTimeout(() => {
      handleSaveChanges(field);
    }, 1000);

    setPendingChanges({
      ...pendingChanges,
      [field]: { value, timer }
    });
  };

  const handleSaveChanges = async (field: string) => {
    if (!isOnline || !schoolInfo) {
      setError('Impossible de modifier les informations hors ligne');
      return;
    }

    const changes = pendingChanges[field];
    if (!changes) return;

    if (changes.timer) {
      clearTimeout(changes.timer);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non authentifié');
        return;
      }

      const updateData = {
        [field === 'postalCode' ? 'postal_code' : field]: changes.value
      };

      const { error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      setSchoolInfo(prev => prev ? {
        ...prev,
        [field]: changes.value
      } : null);

      const newPendingChanges = { ...pendingChanges };
      delete newPendingChanges[field];
      setPendingChanges(newPendingChanges);

      setError(null);
    } catch (error) {
      console.error('Error updating school:', error);
      setError('Erreur lors de la mise à jour des informations');
    }
  };

  const handleAddClass = async () => {
    if (!isOnline || !schoolInfo) {
      setError('Impossible d\'ajouter une classe hors ligne');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non authentifié');
        return;
      }

      // Récupérer l'ID de l'école
      const { data: schoolData } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!schoolData) {
        setError('École non trouvée');
        return;
      }

      const { data: newClass, error } = await supabase
        .from('classes')
        .insert([{
          name: '',
          student_count: 0,
          school_id: schoolData.id
        }])
        .select()
        .single();

      if (error) throw error;

      setClasses([...classes, {
        id: newClass.id,
        name: newClass.name,
        studentCount: newClass.student_count
      }]);

      setError(null);
    } catch (error) {
      console.error('Error adding class:', error);
      setError('Erreur lors de l\'ajout de la classe');
    }
  };

  const handleClassChange = async (id: string, field: keyof Class, value: string | number) => {
    if (!isOnline) {
      setError('Impossible de modifier la classe hors ligne');
      return;
    }

    try {
      const updateData = {
        [field === 'studentCount' ? 'student_count' : field]: value
      };

      const { error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setClasses(classes.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      ));

      setError(null);
    } catch (error) {
      console.error('Error updating class:', error);
      setError('Erreur lors de la mise à jour de la classe');
    }
  };

  const handleRemoveClass = async (id: string) => {
    if (!isOnline) {
      setError('Impossible de supprimer la classe hors ligne');
      return;
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClasses(classes.filter(c => c.id !== id));
      setError(null);
    } catch (error) {
      console.error('Error removing class:', error);
      setError('Erreur lors de la suppression de la classe');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  if (!schoolInfo) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="panel">
          <div className="panel-body">
            <div className="text-center text-gray-600 dark:text-gray-400">
              Aucune information d'établissement trouvée
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Paramètres de l'établissement
          </h2>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                <Wifi className="h-4 w-4" />
                Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <WifiOff className="h-4 w-4" />
                Hors ligne
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="panel-body space-y-8">
          {/* Informations générales */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <School className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Nom de l'établissement
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingChanges.name?.value ?? schoolInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  />
                  {pendingChanges.name && (
                    <button
                      onClick={() => handleSaveChanges('name')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  Type d'établissement
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={pendingChanges.type?.value ?? schoolInfo.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  >
                    <option value="universite">Université</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="lycee_pro">Lycée Professionnel</option>
                    <option value="primaire">École Primaire</option>
                  </select>
                  {pendingChanges.type && (
                    <button
                      onClick={() => handleSaveChanges('type')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={pendingChanges.email?.value ?? schoolInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  />
                  {pendingChanges.email && (
                    <button
                      onClick={() => handleSaveChanges('email')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  Téléphone
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={pendingChanges.phone?.value ?? schoolInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  />
                  {pendingChanges.phone && (
                    <button
                      onClick={() => handleSaveChanges('phone')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Adresse */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Adresse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">
                  Adresse
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingChanges.address?.value ?? schoolInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  />
                  {pendingChanges.address && (
                    <button
                      onClick={() => handleSaveChanges('address')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  Ville
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingChanges.city?.value ?? schoolInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  />
                  {pendingChanges.city && (
                    <button
                      onClick={() => handleSaveChanges('city')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  Code postal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pendingChanges.postalCode?.value ?? schoolInfo.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="input"
                    disabled={!isOnline}
                  />
                  {pendingChanges.postalCode && (
                    <button
                      onClick={() => handleSaveChanges('postalCode')}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                      title="Sauvegarder"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Classes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Classes
              </h3>
              <button
                onClick={handleAddClass}
                className="btn-primary"
                disabled={!isOnline}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une classe
              </button>
            </div>

            <div className="space-y-3">
              {classes.map((classInfo) => (
                <div key={classInfo.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-grow grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Nom de la classe
                      </label>
                      <input
                        type="text"
                        value={classInfo.name}
                        onChange={(e) => handleClassChange(classInfo.id, 'name', e.target.value)}
                        className="input"
                        placeholder="ex: 6ème A"
                        disabled={!isOnline}
                      />
                    </div>
                    <div>
                      <label className="label">
                        Nombre d'élèves
                      </label>
                      <input
                        type="number"
                        value={classInfo.studentCount}
                        onChange={(e) => handleClassChange(classInfo.id, 'studentCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className="input"
                        disabled={!isOnline}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveClass(classInfo.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isOnline}
                    title="Supprimer la classe"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              {classes.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Aucune classe n'a été créée
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="panel-footer flex justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}