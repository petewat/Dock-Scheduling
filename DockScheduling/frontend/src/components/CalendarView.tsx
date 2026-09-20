import { useState } from 'react';
import type { Booking, Berth } from '../types';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface CalendarViewProps {
  bookings: Booking[];
  activeBerths: Berth[];
  selectionStart: string | null;
  hoverDay: string | null;
  onDayClick: (dateStr: string) => void;
  onHoverDay: (dateStr: string) => void;
  todayString: string;
  berths: Berth[];
  filterBerthId: string;
  onFilterBerthIdChange: (val: string) => void;
  filterLength: string;
  onFilterLengthChange: (val: string) => void;
}

export function CalendarView({
  bookings,
  activeBerths,
  selectionStart,
  hoverDay,
  onDayClick,
  onHoverDay,
  todayString,
  berths,
  filterBerthId,
  onFilterBerthIdChange,
  filterLength,
  onFilterLengthChange
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerView, setDatePickerView] = useState<'month' | 'year'>('month');
  const [tempYear, setTempYear] = useState<number>(currentDate.getFullYear());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const activeBerthIds = activeBerths.map(b => b.id);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getHeatmapClass = (occupiedCount: number, totalActiveBerths: number) => {
    if (totalActiveBerths === 0) return 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed';
    if (occupiedCount === 0) return 'bg-green-100 border-green-200 hover:bg-green-200';
    
    const ratio = occupiedCount / totalActiveBerths;
    if (ratio >= 1) return 'bg-red-200 border-red-300 hover:bg-red-300 font-bold';
    if (ratio >= 0.75) return 'bg-red-100 border-red-200 hover:bg-red-200';
    if (ratio >= 0.5) return 'bg-orange-100 border-orange-200 hover:bg-orange-200';
    if (ratio >= 0.25) return 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200';
    return 'bg-green-50 border-green-100 hover:bg-green-100';
  };

  return (
    <div className="bg-white border rounded shadow p-3 md:p-6 h-fit overflow-hidden flex flex-col flex-1">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100 flex-shrink-0">
        
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between w-full xl:w-auto gap-2 sm:gap-4 relative">
          <button onClick={prevMonth} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm font-medium">
            &lt; Prev
          </button>

          <div className="relative">
            <h2
              className="text-lg sm:text-2xl font-bold text-gray-800 min-w-[140px] sm:w-64 text-center cursor-pointer hover:text-blue-600 transition-colors rounded hover:bg-gray-50 p-1 whitespace-nowrap"
              onClick={() => {
                setTempYear(year);
                setDatePickerView('month');
                setShowDatePicker(true);
              }}
            >
              {MONTH_NAMES[month]} <span className="hidden sm:inline">{year}</span><span className="sm:hidden">'{year.toString().slice(2)}</span>
            </h2>

            {showDatePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)}></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded shadow-xl border border-gray-200 z-50 w-64 overflow-hidden animate-fade-in">
                  <div className="flex border-b bg-gray-50">
                    <button
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${datePickerView === 'month' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setDatePickerView('month')}
                    >
                      Month
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${datePickerView === 'year' ? 'border-b-2 border-blue-600 text-blue-700 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setDatePickerView('year')}
                    >
                      Year ({tempYear})
                    </button>
                  </div>

                  <div className="p-3">
                    {datePickerView === 'month' && (
                      <div className="grid grid-cols-3 gap-2">
                        {MONTH_NAMES.map((m, i) => (
                          <button
                            key={m}
                            onClick={() => {
                              setCurrentDate(new Date(tempYear, i, 1));
                              setShowDatePicker(false);
                            }}
                            className={`py-2 px-1 text-sm rounded transition-colors ${i === month && tempYear === year
                              ? 'bg-blue-600 text-white font-bold'
                              : 'hover:bg-blue-50 text-gray-700 font-medium'
                              }`}
                          >
                            {m.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    )}

                    {datePickerView === 'year' && (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                        {Array.from({ length: 20 }, (_, i) => 2020 + i).map(y => (
                          <button
                            key={y}
                            onClick={() => {
                              setTempYear(y);
                              setDatePickerView('month');
                            }}
                            className={`py-2 px-1 text-sm rounded transition-colors ${y === tempYear
                              ? 'bg-blue-100 text-blue-700 font-bold border border-blue-300'
                              : 'hover:bg-blue-50 text-gray-700'
                              }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={nextMonth} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm font-medium">
            Next &gt;
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-center xl:items-end w-full xl:w-auto relative mt-4 xl:mt-0 flex-shrink-0">
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium italic mb-1 xl:absolute xl:-top-6 xl:right-1 xl:mb-0">
            Use these options to filter:
          </span>
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-1.5 bg-gray-50 py-1 px-2 rounded border border-gray-200 shadow-sm flex-1 xl:flex-none justify-center">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Berth:</label>
              <select value={filterBerthId} onChange={(e) => onFilterBerthIdChange(e.target.value)} className="border border-gray-300 rounded py-0.5 px-1 focus:ring-1 focus:ring-blue-500 text-xs font-medium w-full max-w-[140px] xl:w-36 bg-white">
                <option value="">Any</option>
                {berths.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 py-1 px-2 rounded border border-gray-200 shadow-sm flex-1 xl:flex-none justify-center">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Size:</label>
              <div className="relative flex items-center w-full max-w-[100px] xl:w-20">
                <input type="number" value={filterLength} onChange={(e) => onFilterLengthChange(e.target.value)} placeholder="Any" className="w-full border border-gray-300 rounded py-0.5 px-2 pr-5 focus:ring-1 focus:ring-blue-500 text-xs font-medium bg-white" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 font-bold">ft</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
            <div key={d} className="text-center font-bold text-gray-500 uppercase text-[10px] md:text-sm tracking-wider pb-2 border-b">
              <span className="hidden lg:inline">{d}</span>
              <span className="hidden sm:inline lg:hidden">{d.substring(0, 3)}</span>
              <span className="sm:hidden">{d.charAt(0)}</span>
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border border-dashed border-gray-200 rounded p-1 sm:p-2 bg-gray-50 opacity-40"></div>
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPast = dateString < todayString;
            const isStartSelection = selectionStart === dateString;

            let isHoverRange = false;
            if (selectionStart !== null && hoverDay !== null && !isStartSelection && !isPast) {
              const min = selectionStart < hoverDay ? selectionStart : hoverDay;
              const max = selectionStart > hoverDay ? selectionStart : hoverDay;
              isHoverRange = dateString >= min && dateString <= max;
            }

            const daysBookings = bookings.filter(b =>
              dateString >= b.startDate &&
              dateString <= b.endDate &&
              activeBerthIds.includes(b.berthId)
            );
            const occupiedCount = daysBookings.length;

            let cellBackgroundClass = '';
            if (isPast) {
              cellBackgroundClass = 'bg-gray-100 border-gray-200 opacity-60';
            } else if (isStartSelection) {
              cellBackgroundClass = 'bg-blue-600 text-white shadow-md transform scale-105 ring-2 ring-blue-300 border-blue-600';
            } else if (isHoverRange) {
              cellBackgroundClass = 'bg-blue-100 border-blue-300 shadow-inner';
            } else {
              cellBackgroundClass = getHeatmapClass(occupiedCount, activeBerths.length);
            }

            return (
              <div
                key={day}
                onClick={() => {
                  if (activeBerths.length > 0 && !isPast) onDayClick(dateString);
                }}
                onMouseEnter={() => {
                  if (selectionStart !== null && activeBerths.length > 0 && !isPast) onHoverDay(dateString);
                }}
                className={`
                  aspect-square border rounded p-1 sm:p-2 transition-all duration-150 flex flex-col overflow-hidden
                  ${activeBerths.length > 0 && !isPast ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'}
                  ${cellBackgroundClass}
                `}
              >
                <span className={`font-semibold text-xs md:text-base ${isPast ? 'text-gray-400' :
                  isStartSelection || isHoverRange ? 'text-blue-900' : 'text-gray-800'
                  }`}>
                  {day}
                </span>

                <div className="flex-1 overflow-y-auto min-h-0 mt-1 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {daysBookings.map(b => (
                    <div key={b.id} className={`text-[8px] sm:text-[10px] px-1 py-0.5 rounded truncate shadow-sm font-medium leading-tight ${isPast ? 'bg-gray-200 text-gray-500 opacity-70' : 'bg-white bg-opacity-80 text-gray-800'
                      }`}>
                      {b.vesselName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
