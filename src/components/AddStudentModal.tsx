import React, { useState, useRef } from 'react';
import { X, UserPlus, RefreshCcw, Copy, Phone, User } from 'lucide-react';
import { generateDefaultPassword } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: File;
    registrationNumber: string;
    classId: string;
  }) => void;
  selectedClass: string;
}

export default function AddStudentModal({ isOpen, onClose, onAdd, selectedClass }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatarUrl = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=120&h=120&fit=crop&crop=faces&auto=format&q=80';

  const handleGeneratePassword = () => {
    if (!firstName || !lastName) {
      setErrors({
        ...errors,
        password: 'Veuillez d\'abord remplir le nom et le prénom'
      });
      return;
    }
    const password = generateDefaultPassword(firstName, lastName, registrationNumber);
    setGeneratedPassword(password);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    alert('Mot de passe copié dans le presse-papier');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setErrors({
          ...errors,
          avatar: 'L\'image ne doit pas dépasser 5MB'
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors({
          ...errors,
          avatar: 'Le fichier doit être une image'
        });
        return;
      }

      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrors({
        ...errors,
        avatar: ''
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = 'Le prénom est requis';
    if (!lastName) newErrors.lastName = 'Le nom est requis';
    if (!email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (!registrationNumber) newErrors.registrationNumber = 'Le numéro d\'immatriculation est requis';
    if (!selectedClass) newErrors.class = 'La classe est requise';
    if (phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onAdd({
        firstName,
        lastName,
        email,
        phone,
        avatar: avatar || undefined,
        registrationNumber,
        classId: selectedClass
      });
      
      // Réinitialiser le formulaire
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAvatar(null);
      setRegistrationNumber('');
      setGeneratedPassword('');
      setAvatarPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Ajouter un étudiant
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`input ${
                  errors.firstName ? 'border-red-300 dark:border-red-500' : ''
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="label">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`input ${
                  errors.lastName ? 'border-red-300 dark:border-red-500' : ''
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="label">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input ${
                  errors.email ? 'border-red-300 dark:border-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+261 XX XX XXX XX"
                  className={`input pl-10 ${
                    errors.phone ? 'border-red-300 dark:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="label">
                N° Immatriculation
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className={`input ${
                  errors.registrationNumber ? 'border-red-300 dark:border-red-500' : ''
                }`}
              />
              {errors.registrationNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.registrationNumber}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">
                Avatar (optionnel)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20">
                    <img
                      src={avatarPreview || defaultAvatarUrl}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <label
                        htmlFor="avatar-input"
                        className="cursor-pointer p-2 rounded-full bg-white dark:bg-gray-800 bg-opacity-80 hover:bg-opacity-100 transition-colors"
                      >
                        <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
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
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Formats acceptés : JPG, PNG, GIF</p>
                    <p>Taille maximale : 5 MB</p>
                  </div>
                  {errors.avatar && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.avatar}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="label">
              Mot de passe généré
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedPassword}
                readOnly
                className="input flex-1"
                placeholder="Cliquez sur le bouton pour générer un nouveau mot de passe"
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="btn-primary"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
              {generatedPassword && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="btn-secondary"
                >
                  <Copy className="h-5 w-5" />
                </button>
              )}
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}