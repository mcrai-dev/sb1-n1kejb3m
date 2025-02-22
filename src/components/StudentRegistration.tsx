import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Users, Search, AlertCircle, Wifi, WifiOff, 
  XCircle, Copy, Printer, Edit2
} from 'lucide-react';
import type { Student, Class } from '../types';
import { supabase } from '../lib/supabase';
import { createStudentAccount } from '../lib/auth';
import CredentialsSheet from './CredentialsSheet';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';

interface Props {
  classes: Class[];
  schoolType: string;
}

interface Credentials {
  email: string;
  password: string;
  message: string;
}

export default function StudentRegistration({ classes: initialClasses, schoolType }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes] = useState<Class[]>(initialClasses);
  const [isOnline, setIsOnline] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: { timer?: NodeJS.Timeout }}>({});
  const [credentials, setCredentials] = useState<{[key: string]: Credentials}>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const navigate = useNavigate();

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Veuillez vous connecter pour accéder à cette page');
        setIsOnline(false);
        return false;
      }

      const { error } = await supabase.from('students').select('count');
      setIsOnline(!error);
      return !error;
    } catch {
      setIsOnline(false);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
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

        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (schoolError) throw schoolError;
        setSchoolId(schoolData.id);

        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('school_id', schoolData.id)
          .order('last_name');

        if (studentsError) throw studentsError;

        setStudents(studentsData.map(student => ({
          id: student.id,
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
          classId: student.class_id,
          registrationNumber: student.registration_number
        })));

        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
      }
    };

    fetchData();

    const connectionInterval = setInterval(checkConnection, 30000);
    return () => clearInterval(connectionInterval);
  }, []);

  const handleAddStudent = async () => {
    if (!isOnline || !schoolId) {
      setError('Impossible d\'ajouter des étudiants hors ligne');
      return;
    }

    if (!selectedClass) {
      setError('Veuillez sélectionner une classe avant d\'ajouter un étudiant');
      return;
    }

    try {
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([{
          first_name: '',
          last_name: '',
          email: '',
          class_id: selectedClass,
          school_id: schoolId,
          registration_number: ''
        }])
        .select()
        .single();

      if (error) throw error;

      setStudents([...students, {
        id: newStudent.id,
        firstName: newStudent.first_name,
        lastName: newStudent.last_name,
        email: newStudent.email,
        classId: newStudent.class_id,
        registrationNumber: newStudent.registration_number
      }]);

      setError(null);
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Erreur lors de l\'ajout de l\'étudiant');
    }
  };

  const handleAddNewStudent = async (studentData: {
    firstName: string;
    lastName: string;
    email: string;
    registrationNumber: string;
    classId: string;
  }) => {
    if (!isOnline || !schoolId) {
      setError('Impossible d\'ajouter des étudiants hors ligne');
      return;
    }

    try {
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([{
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          email: studentData.email,
          registration_number: studentData.registrationNumber,
          class_id: studentData.classId,
          school_id: schoolId
        }])
        .select()
        .single();

      if (error) throw error;

      const student: Student = {
        id: newStudent.id,
        firstName: newStudent.first_name,
        lastName: newStudent.last_name,
        email: newStudent.email,
        classId: newStudent.class_id,
        registrationNumber: newStudent.registration_number
      };

      setStudents([...students, student]);

      await handleCreateAccount(student);

      setError(null);
    } catch (error) {
      console.error('Error adding student:', error);
      setError('Erreur lors de l\'ajout de l\'étudiant');
    }
  };

  const handleStudentChange = async (id: string, field: keyof Student, value: string) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, [field]: value } : student
    ));

    if (pendingChanges[id]?.timer) {
      clearTimeout(pendingChanges[id].timer);
    }

    const timer = setTimeout(() => handleSaveStudent(id), 1000);

    setPendingChanges({
      ...pendingChanges,
      [id]: { timer }
    });
  };

  const handleSaveStudent = async (id: string) => {
    if (!isOnline || !schoolId) {
      setError('Impossible de sauvegarder les modifications hors ligne');
      return;
    }

    try {
      const student = students.find(s => s.id === id);
      if (!student) return;

      const updateData = {
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email,
        registration_number: student.registrationNumber,
        class_id: student.classId,
        school_id: schoolId
      };

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .eq('school_id', schoolId);

      if (error) throw error;

      if (student.firstName && student.lastName && student.email && !credentials[id]) {
        await handleCreateAccount(student);
      }

      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[id];
        return newChanges;
      });

      setError(null);
    } catch (error) {
      console.error('Error updating student:', error);
      setError('Erreur lors de la mise à jour de l\'étudiant');
    }
  };

  const handleCreateAccount = async (student: Student) => {
    if (!isOnline || !schoolId) {
      setError('Impossible de créer le compte hors ligne');
      return;
    }

    if (!student.firstName || !student.lastName || !student.email) {
      setError('Veuillez remplir tous les champs obligatoires avant de créer le compte');
      return;
    }

    try {
      const result = await createStudentAccount(
        student.firstName,
        student.lastName,
        student.email,
        student.registrationNumber
      );

      if (result.exists) {
        setError(result.message);
      } else if (result.defaultPassword) {
        setCredentials(prev => ({
          ...prev,
          [student.id]: {
            email: student.email,
            password: result.defaultPassword,
            message: result.message
          }
        }));
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      setError(error.message || 'Erreur lors de la création du compte');
    }
  };

  const handleRemoveStudent = async (id: string) => {
    if (!isOnline || !schoolId) {
      setError('Impossible de supprimer des étudiants hors ligne');
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
        .eq('school_id', schoolId);

      if (error) throw error;

      setStudents(prev => prev.filter(student => student.id !== id));
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[id];
        return newChanges;
      });
      setError(null);
    } catch (error) {
      console.error('Error removing student:', error);
      setError('Erreur lors de la suppression de l\'étudiant');
    }
  };

  const handleCopyCredentials = (studentId: string) => {
    const creds = credentials[studentId];
    if (creds) {
      const text = `Email: ${creds.email}\nMot de passe: ${creds.password}`;
      navigator.clipboard.writeText(text);
      alert('Identifiants copiés dans le presse-papier');
    }
  };

  const handlePrintCredentials = (student: Student) => {
    const creds = credentials[student.id];
    if (creds) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Identifiants - ${student.firstName} ${student.lastName}</title>
              <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; }
                .print-content { width: 210mm; height: 297mm; }
              </style>
            </head>
            <body>
              <div class="print-content">
                ${document.getElementById('credentials-sheet-' + student.id)?.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, data: Partial<Student>) => {
    if (!isOnline || !schoolId) {
      setError('Impossible de modifier l\'étudiant hors ligne');
      return;
    }

    try {
      const updateData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        registration_number: data.registrationNumber,
        class_id: data.classId,
        school_id: schoolId
      };

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .eq('school_id', schoolId);

      if (error) throw error;

      setStudents(prev => prev.map(student => 
        student.id === id ? { ...student, ...data } : student
      ));

      setError(null);
    } catch (error) {
      console.error('Error updating student:', error);
      setError('Erreur lors de la mise à jour de l\'étudiant');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Gestion des étudiants
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

        <div className="panel-body">
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex-1">
              <label className="label">
                Classe
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setError(null);
                }}
                className="input"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} étudiants)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary"
                disabled={!selectedClass || !isOnline}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Ajouter un étudiant
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Prénom</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">N° Immatriculation</th>
                  <th className="table-header">Classe</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students
                  .filter(student =>
                    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((student) => (
                    <tr key={student.id} className="table-row">
                      <td className="table-cell">
                        <input
                          type="text"
                          value={student.lastName}
                          onChange={(e) => handleStudentChange(student.id, 'lastName', e.target.value)}
                          className="input"
                          disabled={!isOnline}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="text"
                          value={student.firstName}
                          onChange={(e) => handleStudentChange(student.id, 'firstName', e.target.value)}
                          className="input"
                          disabled={!isOnline}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="email"
                          value={student.email}
                          onChange={(e) => handleStudentChange(student.id, 'email', e.target.value)}
                          className="input"
                          disabled={!isOnline}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="text"
                          value={student.registrationNumber}
                          onChange={(e) => handleStudentChange(student.id, 'registrationNumber', e.target.value)}
                          className="input"
                          disabled={!isOnline}
                        />
                      </td>
                      <td className="table-cell">
                        <select
                          value={student.classId}
                          onChange={(e) => handleStudentChange(student.id, 'classId', e.target.value)}
                          className="input"
                          disabled={!isOnline}
                        >
                          <option value="">Sélectionner une classe</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(student)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                            title="Modifier"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          {credentials[student.id] && (
                            <>
                              <button
                                onClick={() => handleCopyCredentials(student.id)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                title="Copier les informations de connexion"
                              >
                                <Copy className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handlePrintCredentials(student)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                title="Imprimer les informations de connexion"
                              >
                                <Printer className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isOnline}
                            title="Supprimer"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                        {credentials[student.id] && (
                          <div className="mt-2 text-left text-xs bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                            <p><strong>Email :</strong> {credentials[student.id].email}</p>
                            <p><strong>Mot de passe :</strong> {credentials[student.id].password}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {schoolType === 'universite' && (
          <div className="panel-footer">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Mode Université</h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Les étudiants recevront un email d'invitation pour créer leur compte et rejoindre leur classe.
              </p>
            </div>
          </div>
        )}

        <div className="panel-footer flex justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Retour
          </button>
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddNewStudent}
        selectedClass={selectedClass}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        onSave={handleSaveEdit}
        student={selectedStudent}
        classes={classes}
      />

      <div className="hidden">
        {Object.entries(credentials).map(([studentId, creds]) => {
          const student = students.find(s => s.id === studentId);
          if (student) {
            return (
              <div key={studentId} id={`credentials-sheet-${studentId}`}>
                <CredentialsSheet
                  email={creds.email}
                  password={creds.password}
                  firstName={student.firstName}
                  lastName={student.lastName}
                  type="student"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}