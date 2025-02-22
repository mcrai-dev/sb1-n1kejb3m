export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  classId: string;
  registrationNumber: string;
}

export interface Class {
  id: string;
  name: string;
  studentCount: number;
}

export interface SchoolInfo {
  name: string;
  type: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  directorName: string;
  classes: Class[];
  aiPreferences: {
    adaptiveLearning: boolean;
    visualLearning: boolean;
    textualLearning: boolean;
    interactiveLearning: boolean;
  };
}

export interface Teacher {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  schoolId: string;
  subjects?: string[]; // IDs des matières assignées
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
}

export interface Course {
  id: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  name: string;
  description?: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
}