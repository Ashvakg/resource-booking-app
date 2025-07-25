'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import Image from 'next/image';
import { format, addDays, startOfWeek } from 'date-fns';

// ✅ Type for employee data
type Employee = {
  uid: string;
  name?: string;
  email: string;
  department?: string;
};

export default function PMBookingCalendar() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [selected, setSelected] = useState<{ uid: string; date: string } | null>(null);
  const [hours, setHours] = useState<number>(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setEmployees(snap.docs.map(doc => doc.data() as Employee));
    };

    const fetchBookings = async () => {
      const snap = await getDocs(collection(db, 'bookings'));
      setBookings(snap.docs.map(doc => doc.data()));
    };

    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
    setDays(weekDays);

    fetchEmployees();
    fetchBookings();
  }, []);

  const grouped = employees.reduce((acc, emp) => {
    const dept = emp.department || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  const getBookingHours = (uid: string, date: string) => {
    return bookings
      .filter(b => b.userId === uid && b.date === date)
      .reduce((sum, b) => sum + (b.hours || 0), 0);
  };

  const handleBooking = async () => {
    if (!selected || hours < 1 || hours > 8) return;

    const { uid, date } = selected;
    const used = getBookingHours(uid, date);
    if (used + hours > 8) {
      setMessage('⛔ Cannot book more than 8 hours in total');
      return;
    }

    await addDoc(collection(db, 'bookings'), {
      userId: uid,
      department: employees.find(e => e.uid === uid)?.department || '',
      date,
      hours,
      status: 'pending',
      createdAt: Timestamp.now(),
    });

    setMessage('✅ Booking submitted');
    setSelected(null);
    setHours(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Image src="/nikkiso-logo.png" alt="Nikkiso Logo" width={120} height={40} />
        <h1 className="text-2xl font-bold text-blue-700">Weekly Resource Booking</h1>
      </div>

      {Object.entries(grouped).map(([dept, emps]: [string, Employee[]]) => (
        <div key={dept} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{dept}</h2>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Employee</th>
                  {days.map(d => (
                    <th key={d} className="p-2 text-center">{format(new Date(d), 'EEE dd')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emps.map((emp: Employee) => (
                  <tr key={emp.uid} className="border-t">
                    <td className="p-2 font-medium whitespace-nowrap">{emp.name || emp.email}</td>
                    {days.map(day => {
                      const booked = getBookingHours(emp.uid, day);
                      return (
                        <td
                          key={day}
                          className="p-2 text-center cursor-pointer hover:bg-blue-100"
                          onClick={() => setSelected({ uid: emp.uid, date: day })}
                        >
                          {booked > 0 ? `${booked}h` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-xl flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            Booking for <strong>{selected.uid}</strong> on <strong>{selected.date}</strong>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={8}
              value={hours}
              onChange={e => setHours(parseInt(e.target.value))}
              className="border p-2 rounded w-24"
            />
            <button
              onClick={handleBooking}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
            >
              Submit
            </button>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-500 hover:underline text-sm"
            >
              Cancel
            </button>
          </div>
          {message && <p className="text-sm mt-2 text-green-600">{message}</p>}
        </div>
      )}
    </div>
  );
}