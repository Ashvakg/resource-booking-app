'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import Image from 'next/image';

type Booking = {
  id: string;
  userId: string;
  start: string;
  end: string;
  status: string;
};

type User = {
  uid: string;
  name: string;
  email: string;
};

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const userSnap = await getDocs(collection(db, 'users'));
      const allUsers = userSnap.docs.map(doc => doc.data() as User);
      setUsers(allUsers);

      const bookingSnap = await getDocs(collection(db, 'bookings'));
      const allBookings = bookingSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Booking),
      }));
      setBookings(allBookings);
    };

    fetchData();
  }, []);

  const getUserName = (uid: string) => {
    const u = users.find(u => u.uid === uid);
    return u?.name || u?.email || uid;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 px-4 py-10">
      <div className="bg-white shadow-xl rounded-xl p-8 sm:p-10 max-w-5xl mx-auto">
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

        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-4">
          Booking Overview
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          View submitted project resource bookings.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-2">{getUserName(b.userId)}</td>
                  <td className="px-4 py-2">{formatDate(b.start)}</td>
                  <td className="px-4 py-2">{formatDate(b.end)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${
                      b.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : b.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-4">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
