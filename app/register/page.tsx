'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !email.endsWith('@nikkiso.com') &&
      !email.endsWith('@nikkisoceig.com')
    ) {
      alert('Please use your official Nikkiso email.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const adminEmails = [
        'ashvak.govindarajula@nikkisoceig.com',
        'your.teammate@nikkiso.com',
      ];

      const isAdmin = adminEmails.includes(email.toLowerCase());

      const roles = isAdmin ? ['admin', 'project_manager'] : [role];

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        roles,
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(user);
      await signOut(auth);
      setSuccess(true);

      // Set cookie for middleware and redirect
      const roleMap: Record<string, string> = {
        admin: 'admin',
        project_manager: 'pm',
        operations_manager: 'ops',
        team_leader: 'teamlead',
        employee: 'employee',
      };

      const routeRole = roleMap[roles[0]]; // use first role
      document.cookie = `user_role=${routeRole}; path=/`;

      setTimeout(() => {
        router.push(`/${routeRole}/dashboard`);
      }, 6000);
    } catch (error: any) {
      console.error('Registration Error:', error);
      alert(error.message || 'Something went wrong. Try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 px-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 sm:p-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/nikkiso-logo.png"
            alt="Nikkiso Logo"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">
          Nikkiso CTG Resource Planning
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Secure portal for authorized project stakeholders
        </p>

        {!success ? (
          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="john.doe@nikkisoceig.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-800"
              />
            </div>

            {!email.includes('ashvak.govindarajula') && (
              <div>
                <label className="text-sm font-medium text-gray-700">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-800"
                >
                  <option value="" disabled>Choose Role</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="operations_manager">Operations Manager</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 font-semibold rounded-lg shadow-md text-white ${
                loading
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-md text-sm text-left">
            ✅ Registration successful!
            <br />
            A verification email has been sent to <strong>{email}</strong>.
            <br />
            Please verify your account before logging in.
            <br />
            Redirecting to login in a few seconds...
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400">
          © 2025 Nikkiso CE&amp;IG – Internal Use Only
        </p>
      </div>
    </div>
  );
}
