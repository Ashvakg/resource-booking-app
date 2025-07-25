// PM Dashboard rewritten to reflect pm/book layout — grid by department and week
'use client';

// PM Dashboard rewritten to reflect pm/book layout — grid by department and week (Mon–Fri only)
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { format, addDays, startOfWeek } from 'date-fns';

export default function PMDashboardGrid() {
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [hoverInfo, setHoverInfo] = useState<{ uid: string; date: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const userSnap = await getDocs(collection(db, 'users'));
      const bookingSnap = await getDocs(collection(db, 'bookings'));
      setUsers(userSnap.docs.map(doc => doc.data()));
      setBookings(bookingSnap.docs.map(doc => doc.data()));
    };

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
    setDays(weekDays);

    fetchData();
  }, []);

  const grouped = users.reduce((acc, emp) => {
    const dept = emp.department || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, any[]>);

  const getBookingCell = (uid: string, date: string) => {
    const b = bookings.find(b => b.userId === uid && b.date === date);
    if (!b) return <span className="text-gray-400">—</span>;

    let badgeColor = 'bg-yellow-100 text-yellow-800';
    if (b.status === 'approved') badgeColor = 'bg-green-100 text-green-800';
    if (b.status === 'rejected') badgeColor = 'bg-red-100 text-red-700';

    return (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-medium cursor-pointer ${badgeColor}`}
        onMouseEnter={() => setHoverInfo({ uid, date })}
        onMouseLeave={() => setHoverInfo(null)}
      >
        {b.hours}h
        {hoverInfo?.uid === uid && hoverInfo.date === date && (
          <div className="absolute z-10 bg-white border rounded p-2 mt-1 text-xs shadow-xl">
            <p>Status: {b.status}</p>
            <p>Hours: {b.hours}</p>
          </div>
        )}
      </span>
    );
  };

  const getWeeklyTotal = (uid: string) => {
    return days.reduce((sum, day) => {
      const b = bookings.find(b => b.userId === uid && b.date === day);
      return sum + (b?.hours || 0);
    }, 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Image src="/nikkiso-logo.png" alt="Nikkiso Logo" width={120} height={40} />
        <h1 className="text-2xl font-bold text-blue-700">Welcome back 👋</h1>
        <div className="space-x-4 text-sm">
          <a href="/pm/book" className="text-blue-600 hover:underline">
            + Book Resource
          </a>
          <a href="/pm/calendar" className="text-blue-600 hover:underline">
            View Calendar
          </a>
        </div>
      </div>

      {Object.entries(grouped).map(([dept, emps]: [string, any[]]) => (
        <div key={dept} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{dept}</h2>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm relative">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Employee</th>
                  {days.map(d => (
                    <th key={d} className="p-2 text-center">{format(new Date(d), 'EEE dd')}</th>
                  ))}
                  <th className="p-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {emps.map(emp => (
                  <tr key={emp.uid} className="border-t">
                    <td className="p-2 font-medium whitespace-nowrap">{emp.name || emp.email}</td>
                    {days.map(day => (
                      <td key={day} className="p-2 text-center relative">
                        {getBookingCell(emp.uid, day)}
                      </td>
                    ))}
                    <td className="p-2 text-center font-semibold text-blue-700">
                      {getWeeklyTotal(emp.uid)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
