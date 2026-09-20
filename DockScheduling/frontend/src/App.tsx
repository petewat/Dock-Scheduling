import { useState, useEffect } from 'react';
import { BookingModal } from './components/BookingModal';
import { BerthMap } from './components/BerthMap';
import { CalendarView } from './components/CalendarView';
import type { Berth, Booking } from './types';

const BERTHS: Berth[] = [
  { id: '1', name: "North Pier West", length: 410, facilities: ['Shore Power (480V)', 'Potable Water', 'Crane Access (10t)'], recommendations: ['Large commercial vessels', 'Deep-draft ships', 'Heavy cargo loading'], colorClass: 'bg-blue-700' },
  { id: '2', name: "North Pier East", length: 240, facilities: ['Shore Power (480V)', 'Potable Water'], recommendations: ['Mid-size research vessels', 'Extended maintenance stays'], colorClass: 'bg-sky-600' },
  { id: '3', name: "North Pier Face", length: 75, facilities: ['Potable Water'], recommendations: ['Quick provisioning', 'Short-term transient vessels', 'Tugs'], colorClass: 'bg-cyan-500' },
  { id: '4', name: "South Float West", length: 90, facilities: ['Shore Power (240V)', 'Fuel Dock'], recommendations: ['Refueling stops', 'Charter yachts', 'Coast Guard patrols'], colorClass: 'bg-emerald-600' },
  { id: '5', name: "South Float East", length: 90, facilities: ['Shore Power (240V)'], recommendations: ['Private yachts', 'Catamarans', 'Overnight transient mooring'], colorClass: 'bg-teal-500' },
  { id: '6', name: "Inner Channel", length: 55, facilities: ['Mooring Only', 'No Utilities'], recommendations: ['Small fishing boats', 'Overflow mooring', 'Day-use skiffs'], colorClass: 'bg-amber-500' }
];

const BUFFER_FT = 15;

function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Global Filter State
  const [filterLength, setFilterLength] = useState<string>('');
  const [filterBerthId, setFilterBerthId] = useState<string>('');

  // Interactive Selection State
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  
  // Booking Target State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const actualToday = new Date();
  const todayString = `${actualToday.getFullYear()}-${String(actualToday.getMonth() + 1).padStart(2, '0')}-${String(actualToday.getDate()).padStart(2, '0')}`;

  const fetchBookings = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/bookings`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDayClick = (dateStr: string) => {
    if (selectionStart === null) {
      setSelectionStart(dateStr);
      setHoverDay(dateStr);
    } else {
      const dates = [selectionStart, dateStr].sort();
      setStartDate(dates[0]);
      setEndDate(dates[1]);
      setShowModal(true);
    }
  };

  const handleConfirmBooking = async (payload: any) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      let res = await fetch(`${API_URL}/api/bookings/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 409) {
        const data = await res.json();
        if (window.confirm(data.message)) {
          payload.overrideWarning = true;
          res = await fetch(`${API_URL}/api/bookings/auto-assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } else {
          return; // User cancelled
        }
      }

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to book');
        return;
      }

      setShowModal(false);
      fetchBookings(); // refresh calendar
      setSelectionStart(null);
      setHoverDay(null);
    } catch (err) {
      console.error(err);
      alert('Network error while booking');
    }
  };

  // --- Filter Logic ---
  const activeBerths = (() => {
    let filtered = BERTHS;
    if (filterBerthId) filtered = filtered.filter(b => b.id === filterBerthId);
    if (filterLength) {
      const requiredLength = parseInt(filterLength) + BUFFER_FT;
      filtered = filtered.filter(b => b.length >= requiredLength);
    }
    return filtered;
  })();

  const berthsFilteredBySize = (() => {
    if (filterLength) {
      const requiredLength = parseInt(filterLength) + BUFFER_FT;
      return BERTHS.filter(b => b.length >= requiredLength);
    }
    return BERTHS;
  })();

  // --- Unavailable Berths during Pending Selection ---
  const pendingUnavailableBerthIds = (() => {
    if (!selectionStart || !hoverDay) return [];
    if (hoverDay < todayString) return [];
    const rangeMin = selectionStart < hoverDay ? selectionStart : hoverDay;
    const rangeMax = selectionStart > hoverDay ? selectionStart : hoverDay;
    
    return BERTHS.filter(berth => {
      return bookings.some(b => 
        b.berthId === berth.id && 
        b.startDate <= rangeMax && 
        b.endDate >= rangeMin
      );
    }).map(b => b.id);
  })();

  // Map should gray out piers that have active overlaps OR are filtered out
  const filteredOutBerthIds = BERTHS.filter(b => !activeBerths.find(a => a.id === b.id)).map(b => b.id);
  const combinedUnavailableBerthIds = Array.from(new Set([...pendingUnavailableBerthIds, ...filteredOutBerthIds]));
  
  // --- Valid Berths for Form ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center relative z-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold">Harborview Dock Schedule</h1>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 w-full max-w-[2000px] mx-auto">
        <div className="w-full xl:w-[65%] 2xl:w-[70%] flex flex-col mx-auto xl:mx-0">
          <div className={`border p-3 md:px-4 md:py-3 rounded-lg mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm transition-colors duration-300 flex-shrink-0 ${selectionStart === null ? 'bg-white border-gray-300 text-gray-700' : 'bg-blue-100 border-blue-300 text-blue-900'}`}>
            <div className="flex items-start sm:items-center gap-3">
              <div className={`rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold text-sm mt-0.5 sm:mt-0 ${selectionStart === null ? 'bg-gray-500 text-white' : 'bg-blue-600 text-white'}`}>
                {selectionStart === null ? '1' : '2'}
              </div>
              <span className="text-sm md:text-base">
                {selectionStart === null
                  ? <span>Select a <strong>Start Date</strong> on the calendar to begin a new booking.</span>
                  : <span>Select an <strong>End Date</strong> to complete your booking window.</span>
                }
              </span>
            </div>

            {selectionStart !== null && (
              <button
                onClick={() => { setSelectionStart(null); setHoverDay(null); }}
                className="w-full sm:w-auto bg-white border border-blue-300 text-blue-700 px-4 py-1.5 rounded hover:bg-blue-50 hover:text-blue-900 font-semibold transition-colors shadow-sm text-sm"
              >
                Cancel Selection
              </button>
            )}
          </div>

          {activeBerths.length === 0 && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center mb-6 border border-red-200 font-semibold text-sm">
              No berths match your current filters!
            </div>
          )}

          <CalendarView
            bookings={bookings}
            activeBerths={activeBerths}
            selectionStart={selectionStart}
            hoverDay={hoverDay}
            onDayClick={handleDayClick}
            onHoverDay={setHoverDay}
            todayString={todayString}
            berths={berthsFilteredBySize}
            filterBerthId={filterBerthId}
            onFilterBerthIdChange={setFilterBerthId}
            filterLength={filterLength}
            onFilterLengthChange={setFilterLength}
          />
        </div>

        <BerthMap 
          berths={BERTHS} 
          unavailableBerthIds={combinedUnavailableBerthIds} 
        />
      </main>

      <BookingModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectionStart(null);
          setHoverDay(null);
        }}
        onConfirm={handleConfirmBooking}
        startDate={startDate}
        endDate={endDate}
        filterLength={filterLength}
        filterBerthId={filterBerthId}
        berths={BERTHS}
        bookings={bookings} 
      />
    </div>
  );
}

export default App;
