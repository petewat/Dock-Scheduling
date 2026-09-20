import { useState, useEffect, useMemo } from 'react';
import type { Berth, Booking } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: any) => Promise<void>;
  startDate: string;
  endDate: string;
  filterLength: string;
  filterBerthId: string;
  berths: Berth[];
  bookings: Booking[];
}

const BUFFER_FT = 15;

export function BookingModal({
  isOpen,
  onClose,
  onConfirm,
  startDate,
  endDate,
  filterLength,
  filterBerthId,
  berths,
  bookings
}: BookingModalProps) {
  const [vesselName, setVesselName] = useState('');
  const [vesselLength, setVesselLength] = useState<string>(filterLength);
  const [selectedBerth, setSelectedBerth] = useState<string>('');
  const [isEvent, setIsEvent] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [workNumber, setWorkNumber] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [email, setEmail] = useState('');
  const [extraNote, setExtraNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute validBerths internally based on the local vesselLength state
  const validBerths = useMemo(() => {
    const requiredLength = (!isEvent && vesselLength && parseInt(vesselLength) > 0) 
      ? parseInt(vesselLength) + BUFFER_FT 
      : 0;

    const valid = berths.filter(berth => {
      if (berth.length < requiredLength) return false;
      return !bookings.some(b =>
        b.berthId === berth.id &&
        b.startDate <= endDate &&
        b.endDate >= startDate
      );
    });
    return valid.sort((a, b) => a.length - b.length);
  }, [isEvent, vesselLength, berths, bookings, startDate, endDate]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setVesselName('');
      setVesselLength(filterLength);
      setIsEvent(false);
      setCompanyName('');
      setContactName('');
      setWorkNumber('');
      setCellNumber('');
      setEmail('');
      setExtraNote('');
      if (filterBerthId) {
        setSelectedBerth(filterBerthId);
      }
    }
  }, [isOpen, filterLength, filterBerthId]);

  // Auto-select the optimal berth whenever the mathematical parameters change
  useEffect(() => {
    // Only snap to the new optimal if we are actively setting properties,
    // or if the currently selected berth is completely invalid.
    if (validBerths.length > 0) {
      // If the user already has filterBerthId set and it matches, keep it. 
      // Otherwise, snap to the optimal fit.
      const shouldKeepFilter = filterBerthId && validBerths.find(b => b.id === filterBerthId) && selectedBerth === filterBerthId;
      if (!shouldKeepFilter) {
        setSelectedBerth(validBerths[0].id);
      }
    } else {
      setSelectedBerth('');
    }
  }, [validBerths, filterBerthId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!vesselName || !companyName || !workNumber || !email) {
      alert("Please fill in all mandatory fields (Name, Company Name, Work Number, and Email).");
      return;
    }
    
    if (!isEvent && (!vesselLength || parseInt(vesselLength) <= 0)) {
      alert("Length is mandatory for standard vessel bookings.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onConfirm({
        vesselName,
        vesselLength: isEvent ? 0 : parseInt(vesselLength) || 0,
        startDate,
        endDate,
        overrideWarning: false,
        targetBerthId: selectedBerth,
        companyName,
        contactName,
        workNumber,
        cellNumber,
        email,
        extraNote
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold">Create New Booking</h2>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
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

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">
                {isEvent ? 'Event Name' : 'Vessel Name'} <span className="text-red-500">*</span>
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
                <label className="block text-sm text-gray-600 mb-1">Length (ft) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={vesselLength}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || Number(val) > 0) setVesselLength(val);
                  }}
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Company Name <span className="text-red-500">*</span></label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ocean Cargo Ltd." />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Contact Name <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. Jane Doe" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Work Number <span className="text-red-500">*</span></label>
              <input type="tel" value={workNumber} onChange={e => setWorkNumber(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. 555-123-4567" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Cell Number <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
              <input type="tel" value={cellNumber} onChange={e => setCellNumber(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. 555-987-6543" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. info@company.com" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Extra Note <span className="text-gray-400 text-xs font-normal">(Optional)</span></label>
            <textarea value={extraNote} onChange={e => setExtraNote(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Any special requirements..." />
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
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm sm:text-base text-gray-600 hover:bg-gray-100 rounded"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={validBerths.length === 0 || !vesselName || (!isEvent && (!vesselLength || parseInt(vesselLength) <= 0)) || isSubmitting}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 rounded shadow font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
