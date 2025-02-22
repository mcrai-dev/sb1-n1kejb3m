import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RefreshCcw, Copy, Phone, User, Upload } from 'lucide-react';
import { generateDefaultPassword } from '../lib/utils';
import { uploadAvatar, deleteAvatar } from '../lib/storage';
import type { Student, Class } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Student>) => void;
  student: Student | null;
  classes: Class[];
}

export default function EditStudentModal({ isOpen, onClose, onSave, student, classes }: Props) {
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatarUrl = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop&crop=faces&auto=format&q=80';

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone || '',
        avatar: student.avatar || '',
        registrationNumber: student.registrationNumber,
        classId: student.classId
      });
      setAvatarPreview(student.avatar || '');
    }
  }, [student]);

  const handleGeneratePassword = () => {
    if (!formData.firstName || !formData.lastName) {
      setErrors({
        ...errors,
        password: 'Veuillez d\'abord remplir le nom et le prénom'
      });
      return;
    }
    const password = generateDefaultPassword(
      formData.firstName,
      formData.lastName,
      formData.registrationNumber
    );
    setGeneratedPassword(password);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    alert('Mot de passe copié dans le presse-papier');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    try {
      setIsUploading(true);
      setErrors({ ...errors, avatar: '' });

      // Si un avatar existe déjà, le supprimer
      if (formData.avatar) {
        await deleteAvatar(formData.avatar);
      }

      // Uploader le nouvel avatar
      const publicUrl = await uploadAvatar(file, student.id);

      // Mettre à jour le formulaire et l'aperçu
      setFormData({ ...formData, avatar: publicUrl });
      setAvatarPreview(publicUrl);
    } catch (error: any) {
      setErrors({ ...errors, avatar: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName) newErrors.lastName = 'Le nom est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d\'email invalide';
    if (!formData.registrationNumber) newErrors.registrationNumber = 'Le numéro d\'immatriculation est requis';
    if (!formData.classId) newErrors.class = 'La classe est requise';
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && student) {
      onSave(student.id, formData);
      setGeneratedPassword('');
      onClose();
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Modifier l'étudiant
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Avatar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20">
                    <img
                      src={avatarPreview || defaultAvatarUrl}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <label
                        htmlFor="avatar-input"
                        className="cursor-pointer p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors"
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
                        ) : (
                          <Upload className="h-5 w-5 text-gray-700" />
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="text-sm text-gray-500">
                    <p>Formats acceptés : JPG, PNG, GIF</p>
                    <p>Taille maximale : 5 MB</p>
                  </div>
                  {errors.avatar && (
                    <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Autres champs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full border ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full border ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+261 XX XX XXX XX"
                  className={`w-full pl-10 border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Immatriculation
              </label>
              <input
                type="text"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className={`w-full border ${
                  errors.registrationNumber ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.registrationNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.registrationNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe
              </label>
              <select
                value={formData.classId || ''}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className={`w-full border ${
                  errors.class ? 'border-red-300' : 'border-gray-300'
                } rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.studentCount} étudiants)
                  </option>
                ))}
              </select>
              {errors.class && (
                <p className="mt-1 text-sm text-red-600">{errors.class}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Générer un nouveau mot de passe
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedPassword}
                readOnly
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg shadow-sm"
                placeholder="Cliquez sur le bouton pour générer un nouveau mot de passe"
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
              {generatedPassword && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Copy className="h-5 w-5" />
                </button>
              )}
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}