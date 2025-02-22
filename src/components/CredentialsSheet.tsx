import React from 'react';
import { School, Lock, Mail } from 'lucide-react';

interface CredentialsSheetProps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  type: 'student' | 'teacher';
}

export default function CredentialsSheet({ 
  email, 
  password, 
  firstName, 
  lastName,
  type
}: CredentialsSheetProps) {
  return (
    <div className="w-[21cm] h-[29.7cm] p-8 bg-white">
      <div className="border-2 border-purple-200 rounded-lg p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <School className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Edubot</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Informations de connexion</p>
            <p className="text-sm font-medium text-purple-600">
              {type === 'student' ? 'Étudiant' : 'Enseignant'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Bienvenue {firstName} {lastName},
          </h2>
          <p className="text-gray-600">
            Voici vos identifiants de connexion pour accéder à votre espace {type === 'student' ? 'étudiant' : 'enseignant'} Edubot.
            Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Email</h3>
            </div>
            <p className="text-lg font-mono pl-8">{email}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Mot de passe</h3>
            </div>
            <p className="text-lg font-mono pl-8">{password}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-medium text-gray-900 mb-4">Instructions :</h3>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Rendez-vous sur la plateforme Edubot</li>
            <li>Cliquez sur "Se connecter"</li>
            <li>Entrez votre email et mot de passe</li>
            <li>Lors de votre première connexion, vous serez invité à changer votre mot de passe</li>
          </ol>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Pour des raisons de sécurité, conservez ces informations en lieu sûr et ne les partagez avec personne.</p>
          <p>En cas de problème de connexion, contactez votre administration.</p>
        </div>
      </div>
    </div>
  );
}