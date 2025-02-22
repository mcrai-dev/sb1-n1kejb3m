import React, { useState, useRef } from 'react';
import { X, UserPlus, Phone, User, Mail, Book, RefreshCcw, Copy } from 'lucide-react';
import { createTeacherAccount } from '../lib/auth';
import { generateDefaultPassword } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (teacher: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    bio?: string;
  }) => void;
}

export default function AddTeacherModal({ isOpen, onClose, onAdd }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePassword = () => {
    if (!firstName || !lastName) {
      setErrors({
        ...errors,
        password: 'Veuillez d\'abord remplir le nom et le prénom'
      });
      return;
    }
    const password = generateDefaultPassword(firstName, lastName);
    setGeneratedPassword(password);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    alert('Mot de passe copié dans le presse-papier');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = 'Le prénom est requis';
    if (!lastName) newErrors.lastName = 'Le nom est requis';
    if (!email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const result = await createTeacherAccount(
          firstName,
          lastName,
          email,
          phone,
          bio
        );

        if (result.exists) {
          setErrors({ auth: result.message });
        } else {
          onAdd({
            firstName,
            lastName,
            email,
            phone,
            bio
          });
          
          // Réinitialiser le formulaire
          setFirstName('');
          setLastName('');
          setEmail('');
          setPhone('');
          setBio('');
          setGeneratedPassword('');
          onClose();
        }
      } catch (error: any) {
        setErrors({
          auth: error.message || 'Erreur lors de la création du compte'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="panel-header">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Ajouter un enseignant
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="panel-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">
                Prénom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`input pl-10 ${
                    errors.firstName ? 'border-red-300 dark:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="label">
                Nom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`input pl-10 ${
                    errors.lastName ? 'border-red-300 dark:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input pl-10 ${
                    errors.email ? 'border-red-300 dark:border-red-500' : ''
                  }`}
                />
              </div>
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

            <div className="md:col-span-2">
              <label className="label">
                Bio (optionnel)
              </label>
              <div className="relative">
                <Book className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="input pl-10"
                  placeholder="Parcours, spécialités, expérience..."
                />
              </div>
            </div>

            <div className="md:col-span-2">
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
          </div>

          {errors.auth && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {errors.auth}
            </div>
          )}

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
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Ajouter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}