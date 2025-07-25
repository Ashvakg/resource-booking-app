'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !email.endsWith('@nikkiso.com') &&
      !email.endsWith('@nikkisoceig.com')
    ) {
      setError('Please use your official Nikkiso email.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        setError('User profile not found in Firestore.');
        return;
      }

      const roles = userDoc.data().roles;
      if (!roles || roles.length === 0) {
        setError('Role not assigned. Contact admin.');
        return;
      }

      const role = roles[0]; // assume single-role
      const roleMap: Record<string, string> = {
        admin: 'admin',
        project_manager: 'pm',
        operations_manager: 'ops',
        team_leader: 'teamlead',
        employee: 'employee',
      };

      const pathRole = roleMap[role];
      if (!pathRole) {
        setError(`Unknown role: ${role}`);
        return;
      }

      // Set cookie for middleware.ts
      document.cookie = `user_role=${pathRole}; path=/`;

      // Redirect to role-based dashboard
      router.push(`/${pathRole}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 px-4">
      <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-10 sm:p-12 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/nikkiso-logo.png"
            alt="Nikkiso Logo"
            width={140}
            height={45}
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-blue-700 mb-1">
          Nikkiso CTG Login Portal
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Secure access for authorized team members
        </p>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          {error && (
            <p className="text-sm text-red-600 bg-red-100 px-4 py-2 rounded-lg shadow-sm">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="john.doe@nikkisoceig.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-200"
          >
            Log In
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-400">
          © 2025 Nikkiso CE&IG – Internal Use Only
        </p>
      </div>
    </div>
  );
}
