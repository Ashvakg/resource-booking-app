'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import Image from 'next/image';

type EmployeeRow = {
  'Employee Name': string;
  ID: string;
  Department: string;
  role: string;
  email: string;
  Status: string;
};

type Employee = {
  uid: string;
  name: string;
  department: string;
  role: string;
  email: string;
  status: string;
  createdAt: string;
};

export default function EmployeePage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  // 🔁 Fetch users from Firestore
  const fetchEmployees = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        uid: d.uid,
        name: d.name || '—',
        department: d.department || '—',
        role: d.role || '—',
        email: d.email,
        status: d.status || 'active',
        createdAt: d.createdAt || '',
      };
    });
    setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<EmployeeRow>(sheet, { defval: '' });

      for (const row of rows) {
        const name = row['Employee Name']?.trim();
        const id = row['ID']?.toString().trim();
        const department = row['Department']?.trim();
        const role = row['role']?.trim().toLowerCase();
        const email = row['email']?.trim().toLowerCase();
        const status = row['Status']?.trim().toLowerCase();

        if (!id || !email || !role) continue;

        await setDoc(doc(db, 'users', id), {
          uid: id,
          email,
          name,
          department,
          role,
          status,
          createdAt: new Date().toISOString(),
        });
      }

      setMessage('✅ Upload successful');
      fetchEmployees(); // refresh list
    } catch (err: any) {
      console.error(err);
      setMessage('❌ Upload failed');
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 px-4 py-10">
      <div className="bg-white shadow-xl rounded-xl p-8 sm:p-10 max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/nikkiso-logo.png"
            alt="Nikkiso Logo"
            width={120}
            height={40}
            className="object-contain"
          />
        </div>

        {/* Upload Section */}
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">
          Employee Upload & Directory
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Upload a structured Excel file with employee information. Existing entries will be updated.
        </p>

        <input
          type="file"
          accept=".xlsx"
          onChange={handleFile}
          disabled={uploading}
          className="mb-4"
        />

        {uploading && <p className="text-blue-600 mb-2">Uploading...</p>}
        {message && <p className="text-sm mb-6">{message}</p>}

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.uid} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">{emp.uid}</td>
                  <td className="px-4 py-2">{emp.name}</td>
                  <td className="px-4 py-2">{emp.email}</td>
                  <td className="px-4 py-2 capitalize">{emp.role}</td>
                  <td className="px-4 py-2">{emp.department}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
                      emp.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Required Excel columns: Employee Name, ID, Department, role, email, Status
        </p>
      </div>
    </div>
  );
}
