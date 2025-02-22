import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Users, Search, AlertCircle, Wifi, WifiOff,
  GraduationCap, BookOpen, Book, Plus, Trash2, Edit2, X,
  Copy, Printer
} from 'lucide-react';
import type { Teacher, Subject, Course, Class } from '../types';
import { supabase } from '../lib/supabase';
import { DataTable } from './DataTable';
import { EditableCell } from './DataTable/EditableCell';
import { SelectCell } from './DataTable/SelectCell';
import AddTeacherModal from './AddTeacherModal';
import CredentialsSheet from './CredentialsSheet';

interface Props {
  schoolId: string;
  classes: Class[];
}

export default function TeacherManagement({ schoolId, classes }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'teachers' | 'subjects' | 'courses'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<{[key: string]: { email: string; password: string; message: string }}>({});
  const navigate = useNavigate();

  // Vérifier la connexion à Supabase
  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('teachers').select('count');
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
          setError('Impossible de se connecter à la base de données');
          setIsLoading(false);
          return;
        }

        // Get the current user's school if not provided
        let currentSchoolId = schoolId;
        if (!currentSchoolId) {
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
          currentSchoolId = schoolData.id;
        }

        // Fetch teachers with their assigned subjects
        const { data: teachersData, error: teachersError } = await supabase
          .from('teachers')
          .select(`
            *,
            teacher_subjects (
              subject_id
            )
          `)
          .eq('school_id', currentSchoolId)
          .order('last_name');

        if (teachersError) throw teachersError;

        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', currentSchoolId)
          .order('name');

        if (subjectsError) throw subjectsError;

        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            subjects (name),
            teachers (first_name, last_name),
            classes (name)
          `);

        if (coursesError) throw coursesError;

        setTeachers(teachersData.map(teacher => ({
          id: teacher.id,
          userId: teacher.user_id,
          firstName: teacher.first_name,
          lastName: teacher.last_name,
          email: teacher.email,
          phone: teacher.phone,
          bio: teacher.bio,
          schoolId: teacher.school_id,
          subjects: teacher.teacher_subjects?.map((ts: any) => ts.subject_id) || []
        })));

        setSubjects(subjectsData.map(subject => ({
          id: subject.id,
          name: subject.name,
          description: subject.description,
          schoolId: subject.school_id
        })));

        setCourses(coursesData.map(course => ({
          id: course.id,
          subjectId: course.subject_id,
          teacherId: course.teacher_id,
          classId: course.class_id,
          name: course.name,
          description: course.description
        })));

        setIsLoading(false);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    const connectionInterval = setInterval(checkConnection, 30000);
    return () => clearInterval(connectionInterval);
  }, [schoolId]);

  const handleAddTeacher = async () => {
    if (!isOnline) {
      setError('Impossible d\'ajouter un enseignant hors ligne');
      return;
    }

    setIsAddModalOpen(true);
  };

  const handleAddNewTeacher = async (teacherData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    bio?: string;
  }) => {
    if (!isOnline) {
      setError('Impossible d\'ajouter un enseignant hors ligne');
      return;
    }

    try {
      // Get the current user's school if not provided
      let currentSchoolId = schoolId;
      if (!currentSchoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Utilisateur non authentifié');
          return;
        }

        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (schoolError) throw schoolError;
        currentSchoolId = schoolData.id;
      }

      const { data: newTeacher, error } = await supabase
        .from('teachers')
        .insert([{
          first_name: teacherData.firstName,
          last_name: teacherData.lastName,
          email: teacherData.email,
          phone: teacherData.phone,
          bio: teacherData.bio,
          school_id: currentSchoolId
        }])
        .select()
        .single();

      if (error) throw error;

      setTeachers([...teachers, {
        id: newTeacher.id,
        firstName: newTeacher.first_name,
        lastName: newTeacher.last_name,
        email: newTeacher.email,
        phone: newTeacher.phone,
        bio: newTeacher.bio,
        schoolId: newTeacher.school_id,
        subjects: []
      }]);

      setError(null);
    } catch (error) {
      console.error('Error adding teacher:', error);
      setError('Erreur lors de l\'ajout de l\'enseignant');
    }
  };

  const handleAddSubject = async () => {
    if (!isOnline) {
      setError('Impossible d\'ajouter une matière hors ligne');
      return;
    }

    try {
      // Get the current user's school if not provided
      let currentSchoolId = schoolId;
      if (!currentSchoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Utilisateur non authentifié');
          return;
        }

        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (schoolError) throw schoolError;
        currentSchoolId = schoolData.id;
      }

      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert([{
          name: '',
          school_id: currentSchoolId
        }])
        .select()
        .single();

      if (error) throw error;

      setSubjects([...subjects, {
        id: newSubject.id,
        name: newSubject.name,
        description: newSubject.description,
        schoolId: newSubject.school_id
      }]);

      setError(null);
    } catch (error) {
      console.error('Error adding subject:', error);
      setError('Erreur lors de l\'ajout de la matière');
    }
  };

  const handleAddCourse = async () => {
    if (!isOnline) {
      setError('Impossible d\'ajouter un cours hors ligne');
      return;
    }

    if (subjects.length === 0) {
      setError('Veuillez d\'abord créer une matière');
      return;
    }

    if (teachers.length === 0) {
      setError('Veuillez d\'abord ajouter un enseignant');
      return;
    }

    if (classes.length === 0) {
      setError('Aucune classe disponible');
      return;
    }

    try {
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert([{
          name: '',
          subject_id: subjects[0].id,
          teacher_id: teachers[0].id,
          class_id: classes[0].id
        }])
        .select()
        .single();

      if (error) throw error;

      setCourses([...courses, {
        id: newCourse.id,
        name: newCourse.name,
        description: newCourse.description,
        subjectId: newCourse.subject_id,
        teacherId: newCourse.teacher_id,
        classId: newCourse.class_id
      }]);

      setError(null);
    } catch (error) {
      console.error('Error adding course:', error);
      setError('Erreur lors de l\'ajout du cours');
    }
  };

  const handleTeacherChange = async (id: string, field: keyof Teacher, value: string) => {
    if (!isOnline) {
      setError('Impossible de modifier l\'enseignant hors ligne');
      return;
    }

    try {
      const updateData = {
        [field === 'firstName' ? 'first_name' : 
          field === 'lastName' ? 'last_name' : field]: value
      };

      const { error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setTeachers(teachers.map(teacher => 
        teacher.id === id ? { ...teacher, [field]: value } : teacher
      ));

      setError(null);
    } catch (error) {
      console.error('Error updating teacher:', error);
      setError('Erreur lors de la mise à jour de l\'enseignant');
    }
  };

  const handleSubjectChange = async (id: string, field: keyof Subject, value: string) => {
    if (!isOnline) {
      setError('Impossible de modifier la matière hors ligne');
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      setSubjects(subjects.map(subject => 
        subject.id === id ? { ...subject, [field]: value } : subject
      ));

      setError(null);
    } catch (error) {
      console.error('Error updating subject:', error);
      setError('Erreur lors de la mise à jour de la matière');
    }
  };

  const handleCourseChange = async (id: string, field: keyof Course, value: string) => {
    if (!isOnline) {
      setError('Impossible de modifier le cours hors ligne');
      return;
    }

    try {
      const updateData = {
        [field === 'subjectId' ? 'subject_id' : 
          field === 'teacherId' ? 'teacher_id' :
          field === 'classId' ? 'class_id' : field]: value
      };

      const { error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setCourses(courses.map(course => 
        course.id === id ? { ...course, [field]: value } : course
      ));

      setError(null);
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Erreur lors de la mise à jour du cours');
    }
  };

  const handleAssignSubject = async (teacherId: string, subjectId: string) => {
    if (!isOnline) {
      setError('Impossible d\'assigner une matière hors ligne');
      return;
    }

    if (!subjectId) {
      return; // Skip if no subject selected
    }

    try {
      // Check if the subject is already assigned to the teacher
      const teacher = teachers.find(t => t.id === teacherId);
      if (teacher?.subjects?.includes(subjectId)) {
        setError('Cette matière est déjà assignée à cet enseignant');
        return;
      }

      const { error } = await supabase
        .from('teacher_subjects')
        .insert([{
          teacher_id: teacherId,
          subject_id: subjectId
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setError('Cette matière est déjà assignée à cet enseignant');
          return;
        }
        throw error;
      }

      // Update local state
      setTeachers(teachers.map(teacher => 
        teacher.id === teacherId 
          ? { 
              ...teacher, 
              subjects: [...(teacher.subjects || []), subjectId]
            } 
          : teacher
      ));

      setError(null);
    } catch (error) {
      console.error('Error assigning subject:', error);
      setError('Erreur lors de l\'assignation de la matière');
    }
  };

  const handleRemoveSubject = async (teacherId: string, subjectId: string) => {
    if (!isOnline) {
      setError('Impossible de retirer la matière hors ligne');
      return;
    }

    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .delete()
        .match({ teacher_id: teacherId, subject_id: subjectId });

      if (error) throw error;

      // Update local state
      setTeachers(teachers.map(teacher => 
        teacher.id === teacherId 
          ? { 
              ...teacher, 
              subjects: teacher.subjects?.filter(id => id !== subjectId) || []
            } 
          : teacher
      ));

      setError(null);
    } catch (error) {
      console.error('Error removing subject:', error);
      setError('Erreur lors du retrait de la matière');
    }
  };

  const handleCopyCredentials = (teacherId: string) => {
    const creds = credentials[teacherId];
    if (creds) {
      const text = `Email: ${creds.email}\nMot de passe: ${creds.password}`;
      navigator.clipboard.writeText(text);
      alert('Identifiants copiés dans le presse-papier');
    }
  };

  const handlePrintCredentials = (teacher: Teacher) => {
    const creds = credentials[teacher.id];
    if (creds) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Identifiants - ${teacher.firstName} ${teacher.lastName}</title>
              <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; }
                .print-content { width: 210mm; height: 297mm; }
              </style>
            </head>
            <body>
              <div class="print-content">
                ${document.getElementById('credentials-sheet-' + teacher.id)?.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  const teacherColumns = [
    {
      key: 'lastName' as keyof Teacher,
      header: 'Nom',
      render: (value: string, teacher: Teacher) => (
        <EditableCell
          value={value}
          onChange={(newValue) => handleTeacherChange(teacher.id, 'lastName', newValue)}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'firstName' as keyof Teacher,
      header: 'Prénom',
      render: (value: string, teacher: Teacher) => (
        <EditableCell
          value={value}
          onChange={(newValue) => handleTeacherChange(teacher.id, 'firstName', newValue)}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'email' as keyof Teacher,
      header: 'Email',
      render: (value: string, teacher: Teacher) => (
        <EditableCell
          value={value}
          type="email"
          onChange={(newValue) => handleTeacherChange(teacher.id, 'email', newValue)}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'phone' as keyof Teacher,
      header: 'Téléphone',
      render: (value: string, teacher: Teacher) => (
        <EditableCell
          value={value || ''}
          type="tel"
          onChange={(newValue) => handleTeacherChange(teacher.id, 'phone', newValue)}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'subjects' as keyof Teacher,
      header: 'Matières',
      render: (value: string[], teacher: Teacher) => (
        <div className="space-y-2">
          <SelectCell
            value=""
            onChange={(subjectId) => handleAssignSubject(teacher.id, subjectId)}
            options={subjects
              .filter(subject => !teacher.subjects?.includes(subject.id))
              .map(subject => ({
                value: subject.id,
                label: subject.name
              }))}
            disabled={!isOnline || subjects.length === 0}
            placeholder="Assigner une matière"
          />
          <div className="flex flex-wrap gap-2">
            {teacher.subjects?.map((subjectId) => {
              const subject = subjects.find(s => s.id === subjectId);
              return subject ? (
                <span
                  key={subject.id}
                  className="badge badge-info"
                >
                  {subject.name}
                  <button
                    onClick={() => handleRemoveSubject(teacher.id, subject.id)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    disabled={!isOnline}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )
    },
    {
      key: 'id' as keyof Teacher,
      header: 'Actions',
      render: (_: string, teacher: Teacher) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* TODO: Implement edit profile */}}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
            disabled={!isOnline}
          >
            <Edit2 className="h-5 w-5" />
          </button>
          {credentials[teacher.id] && (
            <>
              <button
                onClick={() => handleCopyCredentials(teacher.id)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                title="Copier les informations de connexion"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={() => handlePrintCredentials(teacher)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                title="Imprimer les informations de connexion"
              >
                <Printer className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            onClick={() => {/* TODO: Implement delete */}}
            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
            disabled={!isOnline}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  const subjectColumns = [
    {
      key: 'name' as keyof Subject,
      header: 'Nom',
      render: (value: string, subject: Subject) => (
        <EditableCell
          value={value}
          onChange={(newValue) => handleSubjectChange(subject.id, 'name', newValue)}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'description' as keyof Subject,
      header: 'Description',
      render: (value: string, subject: Subject) => (
        <textarea
          value={value || ''}
          onChange={(e) => handleSubjectChange(subject.id, 'description', e.target.value)}
          className="input"
          rows={2}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'id' as keyof Subject,
      header: 'Actions',
      render: (_: string, subject: Subject) => (
        <button
          onClick={() => {/* TODO: Implement delete */}}
          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
          disabled={!isOnline}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )
    }
  ];

  const courseColumns = [
    {
      key: 'name' as keyof Course,
      header: 'Nom',
      render: (value: string, course: Course) => (
        <EditableCell
          value={value}
          onChange={(newValue) => handleCourseChange(course.id, 'name', newValue)}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'subjectId' as keyof Course,
      header: 'Matière',
      render: (value: string, course: Course) => (
        <SelectCell
          value={value}
          onChange={(newValue) => handleCourseChange(course.id, 'subjectId', newValue)}
          options={subjects.map(subject => ({
            value: subject.id,
            label: subject.name
          }))}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'teacherId' as keyof Course,
      header: 'Enseignant',
      render: (value: string, course: Course) => (
        <SelectCell
          value={value}
          onChange={(newValue) => handleCourseChange(course.id, 'teacherId', newValue)}
          options={teachers.map(teacher => ({
            value: teacher.id,
            label: `${teacher.firstName} ${teacher.lastName}`
          }))}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'classId' as keyof Course,
      header: 'Classe',
      render: (value: string, course: Course) => (
        <SelectCell
          value={value}
          onChange={(newValue) => handleCourseChange(course.id, 'classId', newValue)}
          options={classes.map(cls => ({
            value: cls.id,
            label: cls.name
          }))}
          disabled={!isOnline}
        />
      )
    },
    {
      key: 'id' as keyof Course,
      header: 'Actions',
      render: (_: string, course: Course) => (
        <button
          onClick={() => {/* TODO: Implement delete */}}
          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
          disabled={!isOnline}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="panel">
        <div className="panel-header">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Gestion pédagogique
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
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('teachers')}
                  className={`tab-button ${
                    activeTab === 'teachers' ? 'tab-button-active' : 'tab-button-inactive'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  Enseignants
                </button>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className={`tab-button ${
                    activeTab === 'subjects' ? 'tab-button-active' : 'tab-button-inactive'
                  }`}
                >
                  <Book className="h-5 w-5" />
                  Matières
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`tab-button ${
                    activeTab === 'courses' ? 'tab-button-active' : 'tab-button-inactive'
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                  Cours
                </button>
              </nav>
            </div>
          </div>

          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={
                activeTab === 'teachers' ? handleAddTeacher :
                activeTab === 'subjects' ? handleAddSubject :
                handleAddCourse
              }
              className="btn-primary"
              disabled={!isOnline}
            >
              <Plus className="h-5 w-5 mr-2" />
              Ajouter {
                activeTab === 'teachers' ? 'un enseignant' :
                activeTab === 'subjects' ? 'une matière' :
                'un cours'
              }
            </button>
          </div>

          {activeTab === 'teachers' && (
            <DataTable
              data={teachers.filter(teacher =>
                teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              columns={teacherColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Rechercher un enseignant..."
              isLoading={isLoading}
            />
          )}

          {activeTab === 'subjects' && (
            <DataTable
              data={subjects.filter(subject =>
                subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (subject.description || '').toLowerCase().includes(searchTerm.toLowerCase())
              )}
              columns={subjectColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Rechercher une matière..."
              isLoading={isLoading}
            />
          )}

          {activeTab === 'courses' && (
            <DataTable
              data={courses.filter(course =>
                course.name.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              columns={courseColumns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Rechercher un cours..."
              isLoading={isLoading}
            />
          )}
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

      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddNewTeacher} />

      <div className="hidden">
        {Object.entries(credentials).map(([teacherId, creds]) => {
          const teacher = teachers.find(t => t.id === teacherId);
          if (teacher) {
            return (
              <div key={teacherId} id={`credentials-sheet-${teacherId}`}>
                <CredentialsSheet
                  email={creds.email}
                  password={creds.password}
                  firstName={teacher.firstName}
                  lastName={teacher.lastName}
                  type="teacher"
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