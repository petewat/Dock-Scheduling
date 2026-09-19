import { useState, useEffect, useRef } from 'react';

const BERTHS = [
  { id: '1', name: "North Pier West", length: 410, facilities: ['Shore Power (480V)', 'Potable Water', 'Crane Access (10t)'], recommendations: ['Large commercial vessels', 'Deep-draft ships', 'Heavy cargo loading'], colorClass: 'bg-blue-700' },
  { id: '2', name: "North Pier East", length: 240, facilities: ['Shore Power (480V)', 'Potable Water'], recommendations: ['Mid-size research vessels', 'Extended maintenance stays'], colorClass: 'bg-sky-600' },
  { id: '3', name: "North Pier Face", length: 75, facilities: ['Potable Water'], recommendations: ['Quick provisioning', 'Short-term transient vessels', 'Tugs'], colorClass: 'bg-cyan-500' },
  { id: '4', name: "South Float West", length: 90, facilities: ['Shore Power (240V)', 'Fuel Dock'], recommendations: ['Refueling stops', 'Charter yachts', 'Coast Guard patrols'], colorClass: 'bg-emerald-600' },
  { id: '5', name: "South Float East", length: 90, facilities: ['Shore Power (240V)'], recommendations: ['Private yachts', 'Catamarans', 'Overnight transient mooring'], colorClass: 'bg-teal-500' },
  { id: '6', name: "Inner Channel", length: 55, facilities: ['Mooring Only', 'No Utilities'], recommendations: ['Small fishing boats', 'Overflow mooring', 'Day-use skiffs'], colorClass: 'bg-amber-500' }
];

const BUFFER_FT = 15;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function App() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
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

  const actualToday = new Date();
  const todayString = `${actualToday.getFullYear()}-${String(actualToday.getMonth() + 1).padStart(2, '0')}-${String(actualToday.getDate()).padStart(2, '0')}`;

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date()); // Defaults to the actual current system date!
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

  // Date Picker Popover State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerView, setDatePickerView] = useState<'month' | 'year'>('month');
  const [tempYear, setTempYear] = useState<number>(year);

  // Interactive Selection State
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  
  // Global Filter State
  const [filterLength, setFilterLength] = useState<string>('');
  const [filterBerthId, setFilterBerthId] = useState<string>('');

  // Map Hover State
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredBerthId, setHoveredBerthId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Form State
  const [vesselName, setVesselName] = useState('');
  const [vesselLength, setVesselLength] = useState<string>('');
  const [selectedBerth, setSelectedBerth] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isEvent, setIsEvent] = useState(false);

  // Calendar Controls
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (dateStr: string) => {
    if (selectionStart === null) {
      setSelectionStart(dateStr);
      setHoverDay(dateStr);
    } else {
      const dates = [selectionStart, dateStr].sort();
      
      setStartDate(dates[0]);
      setEndDate(dates[1]);
      
      setVesselName('');
      setVesselLength(filterLength);
      setIsEvent(false);
      
      if (filterBerthId) setSelectedBerth(filterBerthId);
      else setSelectedBerth('');
      
      setShowModal(true);
      
      setSelectionStart(null);
      setHoverDay(null);
    }
  };

  const handleCancelSelection = () => {
    setSelectionStart(null);
    setHoverDay(null);
  };

  const handleMapMouseMove = (e: React.MouseEvent, id: string) => {
    setHoveredBerthId(id);
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
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
  const activeBerthIds = activeBerths.map(b => b.id);

  // --- Modal Logic ---
  const validBerths = (() => {
    const lengthNum = isEvent ? 0 : (parseInt(vesselLength) || 0);
    const requiredLength = lengthNum > 0 ? lengthNum + BUFFER_FT : 0;

    const valid = BERTHS.filter(berth => {
      if (berth.length < requiredLength) return false;
      const hasConflict = bookings.some(b => 
        b.berthId === berth.id && 
        b.startDate <= endDate && 
        b.endDate >= startDate
      );
      return !hasConflict;
    });

    return valid.sort((a, b) => a.length - b.length);
  })();

  useEffect(() => {
    if (validBerths.length > 0) {
      const isCurrentValid = validBerths.find(b => b.id === selectedBerth);
      if (!isCurrentValid) {
        setSelectedBerth(validBerths[0].id);
      }
    } else {
      setSelectedBerth('');
    }
  }, [vesselLength, startDate, endDate, validBerths, selectedBerth]);

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVesselLength(e.target.value);
    setSelectedBerth(''); 
  };

  const getHeatmapClass = (occupiedCount: number, totalActiveBerths: number) => {
    if (totalActiveBerths === 0) return 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed';
    if (occupiedCount === 0) return 'bg-green-100 border-green-200 hover:bg-green-200';
    
    const ratio = occupiedCount / totalActiveBerths;
    
    if (ratio >= 1) return 'bg-red-200 border-red-300 hover:bg-red-300';
    if (ratio >= 0.75) return 'bg-red-100 border-red-200 hover:bg-red-200';
    if (ratio >= 0.5) return 'bg-orange-100 border-orange-200 hover:bg-orange-200';
    if (ratio >= 0.25) return 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200';
    return 'bg-green-50 border-green-100 hover:bg-green-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center relative z-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold">Harborview Dock Schedule</h1>
        </div>
      </header>

      {/* Main Layout Area - Split on Large Screens */}
      <main className="flex-1 p-2 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 w-full max-w-[2000px] mx-auto">
        
        {/* Left Column: Calendar (Wider) */}
        <div className="w-full xl:w-[65%] 2xl:w-[70%] flex flex-col mx-auto xl:mx-0">
          
          <div className={`border p-3 md:px-4 md:py-3 rounded-lg mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm transition-colors duration-300 flex-shrink-0 ${
            selectionStart === null 
              ? 'bg-white border-gray-300 text-gray-700' 
              : 'bg-blue-100 border-blue-300 text-blue-900'
          }`}>
            <div className="flex items-start sm:items-center gap-3">
              <div className={`rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center font-bold text-sm mt-0.5 sm:mt-0 ${
                selectionStart === null ? 'bg-gray-500 text-white' : 'bg-blue-600 text-white'
              }`}>
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
                onClick={handleCancelSelection}
                className="w-full sm:w-auto bg-white border border-blue-300 text-blue-700 px-4 py-1.5 rounded hover:bg-blue-50 hover:text-blue-900 font-semibold transition-colors shadow-sm text-sm"
              >
                Cancel Selection
              </button>
            )}
          </div>

          <div className="bg-white border rounded shadow p-3 md:p-6 h-fit overflow-hidden flex flex-col flex-1">
            
            {/* Header & Filter Bar */}
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-gray-100 flex-shrink-0">
              
              {/* Calendar Controls with Date Picker Popover */}
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
                  
                  {/* Date Picker Popover */}
                  {showDatePicker && (
                    <>
                      {/* Invisible overlay to close popover when clicking outside */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)}></div>
                      
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded shadow-xl border border-gray-200 z-50 w-64 overflow-hidden animate-fade-in">
                        {/* Tabs */}
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
                                  className={`py-2 px-1 text-sm rounded transition-colors ${
                                    i === month && tempYear === year
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
                              {Array.from({length: 20}, (_, i) => 2020 + i).map(y => (
                                <button
                                  key={y}
                                  onClick={() => {
                                    setTempYear(y);
                                    setDatePickerView('month');
                                  }}
                                  className={`py-2 px-1 text-sm rounded transition-colors ${
                                    y === tempYear
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
              <div className="flex flex-col items-center xl:items-end w-full xl:w-auto relative mt-2 xl:mt-0 flex-shrink-0">
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium italic mb-1 xl:absolute xl:-top-6 xl:right-1 xl:mb-0">
                  Use these options to filter:
                </span>
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full xl:w-auto">
                  <div className="flex items-center gap-1.5 bg-gray-50 py-1 px-2 rounded border border-gray-200 shadow-sm flex-1 xl:flex-none justify-center">
                    <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                      Berth:
                    </label>
                    <select 
                      value={filterBerthId}
                      onChange={(e) => setFilterBerthId(e.target.value)}
                      className="border border-gray-300 rounded py-0.5 px-1 focus:ring-1 focus:ring-blue-500 text-xs font-medium w-full max-w-[140px] xl:w-36 bg-white"
                    >
                      <option value="">Any</option>
                      {BERTHS.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-gray-50 py-1 px-2 rounded border border-gray-200 shadow-sm flex-1 xl:flex-none justify-center">
                    <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                      Size:
                    </label>
                    <div className="relative flex items-center w-full max-w-[100px] xl:w-20">
                      <input 
                        type="number" 
                        value={filterLength}
                        onChange={(e) => setFilterLength(e.target.value)}
                        placeholder="Any"
                        className="w-full border border-gray-300 rounded py-0.5 px-2 pr-5 focus:ring-1 focus:ring-blue-500 text-xs font-medium bg-white" 
                      />
                      <span className="absolute right-1.5 text-[10px] text-gray-400 font-bold">ft</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeBerths.length === 0 && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center mb-6 border border-red-200 font-semibold text-sm">
                No berths match your current filters!
              </div>
            )}
            
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
                        if (activeBerths.length > 0 && !isPast) handleDayClick(dateString);
                      }}
                      onMouseEnter={() => {
                        if (selectionStart !== null && activeBerths.length > 0 && !isPast) setHoverDay(dateString);
                      }}
                      className={`
                        aspect-square border rounded p-1 sm:p-2 transition-all duration-150 flex flex-col overflow-hidden
                        ${activeBerths.length > 0 && !isPast ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed'}
                        ${cellBackgroundClass}
                      `}
                    >
                      <span className={`font-semibold text-xs md:text-base ${
                        isPast ? 'text-gray-400' : 
                        isStartSelection || isHoverRange ? 'text-blue-900' : 'text-gray-800'
                      }`}>
                        {day}
                      </span>
                      
                      <div className="flex-1 overflow-y-auto min-h-0 mt-1 space-y-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {daysBookings.map(b => (
                          <div key={b.id} className={`text-[8px] sm:text-[10px] px-1 py-0.5 rounded truncate shadow-sm font-medium leading-tight ${
                            isPast ? 'bg-gray-200 text-gray-500 opacity-70' : 'bg-white bg-opacity-80 text-gray-800'
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
        </div>

        {/* Right Column: Interactive Map */}
        <div className="w-full xl:w-[35%] 2xl:w-[30%] flex flex-col mx-auto xl:mx-0 min-w-[300px] mb-8 xl:mb-0 relative z-20">
          <div ref={mapRef} className="bg-white border rounded shadow p-4 md:p-6 flex-1 flex flex-col relative min-h-[550px] sm:min-h-[600px] xl:min-h-[650px]">
            
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                Facility Map
              </h2>
              <p className="text-xs text-gray-500 mt-1">Hover over any berth to view available facilities and details.</p>
            </div>

            {/* Floating Tooltip (Moved OUTSIDE the overflow-hidden map area) */}
            {hoveredBerthId && (
              <div 
                className="absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-2xl w-48 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+12px)] transition-opacity duration-150 border border-gray-700"
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45 border-r border-b border-gray-700"></div>
                
                <h4 className="font-bold text-sm border-b border-gray-700 pb-1.5 mb-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm ${BERTHS.find(b => b.id === hoveredBerthId)?.colorClass}`}></span>
                    {BERTHS.find(b => b.id === hoveredBerthId)?.name}
                  </div>
                </h4>
                <ul className="text-[11px] space-y-1.5 mb-2">
                  {BERTHS.find(b => b.id === hoveredBerthId)?.facilities.map(f => (
                    <li key={f} className="flex items-center gap-1.5">
                      <span className="text-green-400 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-gray-700">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Recommended Uses:</span>
                  <ul className="text-[10px] text-gray-300 mt-1 list-disc pl-3 space-y-0.5">
                    {BERTHS.find(b => b.id === hoveredBerthId)?.recommendations.map(r => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-[10px] text-blue-300 font-semibold mt-2 pt-1.5 border-t border-gray-700 text-right">
                  Max Length: {BERTHS.find(b => b.id === hoveredBerthId)?.length}'
                </div>
              </div>
            )}

            {/* Abstract CSS Map */}
            <div 
              className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-lg relative overflow-hidden flex shadow-inner cursor-default"
              onMouseLeave={() => setHoveredBerthId(null)}
            >
              {/* Landmass */}
              <div className="w-12 h-full absolute left-0 top-0 bg-stone-300 border-r-[3px] border-stone-400 z-0"></div>

              {/* Map Structures */}
              
              {/* North Pier (NPW, NPE, Face) */}
              <div 
                onMouseLeave={() => setHoveredBerthId(null)}
                className="absolute top-[15%] left-12 h-14 w-[75%] flex shadow-md hover:shadow-lg transition-shadow"
              >
                <div 
                  onMouseMove={(e) => handleMapMouseMove(e, '1')}
                  className={`h-full w-[55%] border-y-2 border-r rounded-r-none flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                    ${hoveredBerthId === '1' ? 'bg-blue-600 text-white z-10 scale-[1.02] shadow-xl border-blue-800' : 'bg-blue-700 text-blue-100 border-blue-900 hover:bg-blue-600'}`}
                >
                  NPW
                </div>
                <div 
                  onMouseMove={(e) => handleMapMouseMove(e, '2')}
                  className={`h-full w-[35%] border-y-2 border-x flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                    ${hoveredBerthId === '2' ? 'bg-sky-500 text-white z-10 scale-[1.02] shadow-xl border-sky-700' : 'bg-sky-600 text-sky-100 border-sky-800 hover:bg-sky-500'}`}
                >
                  NPE
                </div>
                <div 
                  onMouseMove={(e) => handleMapMouseMove(e, '3')}
                  className={`h-full w-[10%] border-y-2 border-r-2 border-l rounded-r flex items-center justify-center text-[8px] font-bold transition-all cursor-crosshair
                    ${hoveredBerthId === '3' ? 'bg-cyan-400 text-cyan-900 z-10 scale-[1.02] shadow-xl border-cyan-600' : 'bg-cyan-500 text-cyan-900 border-cyan-700 hover:bg-cyan-400'}`}
                  style={{ transform: hoveredBerthId === '3' ? 'scale(1.02)' : 'none', transformOrigin: 'left center' }}
                >
                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Face</span>
                </div>
              </div>

              {/* Inner Channel */}
              <div 
                onMouseMove={(e) => handleMapMouseMove(e, '6')}
                onMouseLeave={() => setHoveredBerthId(null)}
                className={`absolute top-[45%] left-12 h-16 w-14 border-y-2 border-r-2 rounded-r shadow-md flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                  ${hoveredBerthId === '6' ? 'bg-amber-400 text-amber-900 z-10 scale-[1.02] shadow-xl border-amber-600' : 'bg-amber-500 text-amber-900 border-amber-700 hover:bg-amber-400'}`}
              >
                Inner
              </div>

              {/* South Float (SFW, SFE) */}
              <div 
                onMouseLeave={() => setHoveredBerthId(null)}
                className="absolute top-[75%] left-12 h-12 w-[60%] flex shadow-md hover:shadow-lg transition-shadow"
              >
                <div 
                  onMouseMove={(e) => handleMapMouseMove(e, '4')}
                  className={`h-full w-[50%] border-y-2 border-r flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                    ${hoveredBerthId === '4' ? 'bg-emerald-500 text-white z-10 scale-[1.02] shadow-xl border-emerald-700' : 'bg-emerald-600 text-emerald-100 border-emerald-800 hover:bg-emerald-500'}`}
                >
                  SFW
                </div>
                <div 
                  onMouseMove={(e) => handleMapMouseMove(e, '5')}
                  className={`h-full w-[50%] border-y-2 border-r-2 border-l rounded-r flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                    ${hoveredBerthId === '5' ? 'bg-teal-400 text-teal-900 z-10 scale-[1.02] shadow-xl border-teal-600' : 'bg-teal-500 text-teal-900 border-teal-700 hover:bg-teal-400'}`}
                >
                  SFE
                </div>
              </div>
              

            </div>

            {/* Quick Legend below the map */}
            <div className="mt-4 flex-shrink-0">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-gray-600">
                {BERTHS.map(b => (
                  <div key={b.id} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm shadow-sm ${b.colorClass}`}></span> 
                    <span className="font-semibold">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Create New Booking</h2>
            
            <div className="space-y-4">
              
              {/* Booking Type Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                <button 
                  onClick={() => setIsEvent(false)}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${!isEvent ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Vessel
                </button>
                <button 
                  onClick={() => {
                    setIsEvent(true);
                    setVesselLength('');
                  }}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded transition-colors ${isEvent ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Event
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    {isEvent ? 'Event Name' : 'Vessel Name'}
                  </label>
                  <input 
                    type="text" 
                    value={vesselName}
                    onChange={(e) => setVesselName(e.target.value)}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                    placeholder={isEvent ? "e.g. Harbor Festival" : "e.g. Sea Explorer"} 
                  />
                </div>
                
                {!isEvent && (
                  <div className="sm:w-24">
                    <label className="block text-sm text-gray-600 mb-1">Length (ft)</label>
                    <input 
                      type="number" 
                      value={vesselLength}
                      onChange={handleLengthChange}
                      className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" 
                      placeholder="100" 
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                  <input type="date" value={startDate} readOnly className="w-full border rounded p-2 bg-gray-50 text-gray-500 text-sm sm:text-base" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">End Date</label>
                  <input type="date" value={endDate} readOnly className="w-full border rounded p-2 bg-gray-50 text-gray-500 text-sm sm:text-base" />
                </div>
              </div>

              <hr className="my-4" />

              <div className="bg-blue-50 p-3 sm:p-4 rounded border border-blue-100">
                <label className="block text-sm text-blue-900 font-bold mb-2">Assigned Berth</label>
                
                {validBerths.length === 0 ? (
                  <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200 text-sm font-semibold">
                    No berths are large enough or available for these dates!
                  </div>
                ) : (
                  <>
                    <select 
                      value={selectedBerth}
                      onChange={(e) => setSelectedBerth(e.target.value)}
                      className="w-full border-2 border-blue-300 rounded p-2 sm:p-3 bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 text-sm sm:text-base"
                    >
                      {validBerths.map((b, index) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.length}') {index === 0 ? ' (Optimal Fit)' : ''}
                        </option>
                      ))}
                    </select>
                    
                    <p className="text-xs text-blue-600 mt-2">
                      System automatically selected the best fit, but you can override it above.
                    </p>
                  </>
                )}
              </div>
              
              <div className="pt-2 sm:pt-4 flex justify-end gap-2">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm sm:text-base text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const payload = {
                        vesselName: vesselName,
                        vesselLength: isEvent ? 0 : parseInt(vesselLength) || 0,
                        startDate: startDate,
                        endDate: endDate,
                        overrideWarning: false,
                        targetBerthId: selectedBerth
                      };

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
                  }}
                  disabled={validBerths.length === 0 || !vesselName}
                  className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 rounded shadow font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
