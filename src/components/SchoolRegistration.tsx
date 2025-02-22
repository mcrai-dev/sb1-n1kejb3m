import React, { useState } from 'react';
import { Building2, Phone, MapPin, GraduationCap, Users, Book, Brain, Bot, Lightbulb, School, Plus, Trash2, Mail } from 'lucide-react';
import type { SchoolInfo, Class } from '../types';

interface Props {
  onSubmit: (data: SchoolInfo) => void;
  onCancel: () => void;
}

export default function SchoolRegistration({ onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<SchoolInfo>({
    name: '',
    type: 'college',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    directorName: '',
    classes: [],
    aiPreferences: {
      adaptiveLearning: true,
      visualLearning: true,
      textualLearning: true,
      interactiveLearning: true
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddClass = () => {
    setFormData(prev => ({
      ...prev,
      classes: [...prev.classes, { id: Date.now().toString(), name: '', studentCount: 0 }]
    }));
  };

  const handleRemoveClass = (id: string) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== id)
    }));
  };

  const handleClassChange = (id: string, field: keyof Class, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Le nom est requis';
    if (!formData.email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d\'email invalide';
    if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
    else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }
    if (!formData.address) newErrors.address = 'L\'adresse est requise';
    if (!formData.city) newErrors.city = 'La ville est requise';
    if (!formData.postalCode) newErrors.postalCode = 'Le code postal est requis';
    if (!formData.directorName) newErrors.directorName = 'Le nom du directeur est requis';
    if (formData.classes.length === 0) newErrors.classes = 'Au moins une classe est requise';
    formData.classes.forEach((c, i) => {
      if (!c.name) newErrors[`class-${i}-name`] = 'Le nom de la classe est requis';
      if (c.studentCount < 0) newErrors[`class-${i}-count`] = 'Le nombre d\'élèves doit être positif';
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations générales */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <School className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Informations de l'établissement
            </h3>
          </div>

          <div className="panel-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Nom de l'établissement</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input pl-10 ${errors.name ? 'border-red-300 dark:border-red-500' : ''}`}
                  placeholder="Nom de l'établissement"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="label">Type d'établissement</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="universite">Université</option>
                <option value="college">Collège</option>
                <option value="lycee">Lycée</option>
                <option value="lycee_pro">Lycée Professionnel</option>
                <option value="primaire">École Primaire</option>
              </select>
            </div>

            <div>
              <label className="label">Nom du directeur</label>
              <input
                type="text"
                value={formData.directorName}
                onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                className={`input ${errors.directorName ? 'border-red-300 dark:border-red-500' : ''}`}
                placeholder="Nom du directeur"
              />
              {errors.directorName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.directorName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Contact
            </h3>
          </div>

          <div className="panel-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`input pl-10 ${errors.email ? 'border-red-300 dark:border-red-500' : ''}`}
                  placeholder="email@etablissement.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`input pl-10 ${errors.phone ? 'border-red-300 dark:border-red-500' : ''}`}
                  placeholder="+261 XX XX XXX XX"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Adresse
            </h3>
          </div>

          <div className="panel-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`input pl-10 ${errors.address ? 'border-red-300 dark:border-red-500' : ''}`}
                  placeholder="Adresse complète"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="label">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`input ${errors.city ? 'border-red-300 dark:border-red-500' : ''}`}
                placeholder="Ville"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="label">Code postal</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className={`input ${errors.postalCode ? 'border-red-300 dark:border-red-500' : ''}`}
                placeholder="Code postal"
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.postalCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Classes */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Classes
            </h3>
          </div>

          <div className="panel-body">
            <div className="space-y-4">
              {formData.classes.map((classInfo, index) => (
                <div key={classInfo.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-grow grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Nom de la classe</label>
                      <input
                        type="text"
                        value={classInfo.name}
                        onChange={(e) => handleClassChange(classInfo.id, 'name', e.target.value)}
                        className={`input ${errors[`class-${index}-name`] ? 'border-red-300 dark:border-red-500' : ''}`}
                        placeholder="ex: 6ème A"
                      />
                      {errors[`class-${index}-name`] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`class-${index}-name`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Nombre d'élèves</label>
                      <input
                        type="number"
                        value={classInfo.studentCount}
                        onChange={(e) => handleClassChange(classInfo.id, 'studentCount', parseInt(e.target.value) || 0)}
                        min="0"
                        className={`input ${errors[`class-${index}-count`] ? 'border-red-300 dark:border-red-500' : ''}`}
                      />
                      {errors[`class-${index}-count`] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`class-${index}-count`]}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(classInfo.id)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddClass}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Ajouter une classe
              </button>

              {errors.classes && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.classes}</p>
              )}
            </div>
          </div>
        </div>

        {/* IA Préférences */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Préférences d'apprentissage IA
            </h3>
          </div>

          <div className="panel-body">
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.aiPreferences.adaptiveLearning}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiPreferences: {
                      ...formData.aiPreferences,
                      adaptiveLearning: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-purple-600 dark:text-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <span className="text-gray-700 dark:text-gray-300">Apprentissage adaptatif</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.aiPreferences.visualLearning}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiPreferences: {
                      ...formData.aiPreferences,
                      visualLearning: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-purple-600 dark:text-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <span className="text-gray-700 dark:text-gray-300">Apprentissage visuel</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.aiPreferences.textualLearning}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiPreferences: {
                      ...formData.aiPreferences,
                      textualLearning: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-purple-600 dark:text-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <span className="text-gray-700 dark:text-gray-300">Apprentissage textuel</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.aiPreferences.interactiveLearning}
                  onChange={(e) => setFormData({
                    ...formData,
                    aiPreferences: {
                      ...formData.aiPreferences,
                      interactiveLearning: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-purple-600 dark:text-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
                <span className="text-gray-700 dark:text-gray-300">Apprentissage interactif</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            <Bot className="h-5 w-5 mr-2" />
            Activer l'assistant IA
          </button>
        </div>
      </form>
    </div>
  );
}