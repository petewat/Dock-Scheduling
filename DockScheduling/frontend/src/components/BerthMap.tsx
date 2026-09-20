import { useRef, useState } from 'react';
import type { Berth } from '../types';

interface BerthMapProps {
  berths: Berth[];
  unavailableBerthIds: string[];
}

export function BerthMap({ berths, unavailableBerthIds }: BerthMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredBerthId, setHoveredBerthId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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

  const getMapBerthClass = (berthId: string, defaultClass: string, hoverClass: string) => {
    if (unavailableBerthIds.includes(berthId)) {
      return 'bg-gray-200 text-gray-400 border-gray-300 opacity-70 cursor-not-allowed striped-bg';
    }
    if (hoveredBerthId === berthId) {
      return hoverClass;
    }
    return defaultClass;
  };

  return (
    <div className="w-full xl:w-[35%] 2xl:w-[30%] flex flex-col mx-auto xl:mx-0 min-w-[300px] mb-8 xl:mb-0 relative z-20">
      <div ref={mapRef} className="bg-white border rounded shadow p-4 md:p-6 flex-1 flex flex-col relative min-h-[550px] sm:min-h-[600px] xl:min-h-[650px]">
        <div className="mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            Facility Map
          </h2>
          <p className="text-xs text-gray-500 mt-1">Hover over any berth to view available facilities and details.</p>
        </div>

        {/* Floating Tooltip */}
        {hoveredBerthId && (
          <div
            className="absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-2xl w-48 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+12px)] transition-opacity duration-150 border border-gray-700"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45 border-r border-b border-gray-700"></div>

            <h4 className="font-bold text-sm border-b border-gray-700 pb-1.5 mb-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${berths.find(b => b.id === hoveredBerthId)?.colorClass}`}></span>
                {berths.find(b => b.id === hoveredBerthId)?.name}
              </div>
            </h4>
            <ul className="text-[11px] space-y-1.5 mb-2">
              {berths.find(b => b.id === hoveredBerthId)?.facilities.map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-green-400 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-gray-700">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Recommended Uses:</span>
              <ul className="text-[10px] text-gray-300 mt-1 list-disc pl-3 space-y-0.5">
                {berths.find(b => b.id === hoveredBerthId)?.recommendations.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] text-blue-300 font-semibold mt-2 pt-1.5 border-t border-gray-700 text-right">
              Max Length: {berths.find(b => b.id === hoveredBerthId)?.length}'
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

          {/* North Pier (NPW, NPE, Face) */}
          <div 
            onMouseLeave={() => setHoveredBerthId(null)}
            className="absolute top-[15%] left-12 h-14 w-[75%] flex shadow-md hover:shadow-lg transition-shadow"
          >
            <div 
              onMouseMove={(e) => handleMapMouseMove(e, '1')}
              className={`h-full w-[55%] border-y-2 border-r rounded-r-none flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                ${getMapBerthClass('1', 'bg-blue-700 text-blue-100 border-blue-900 hover:bg-blue-600', 'bg-blue-600 text-white z-10 scale-[1.02] shadow-xl border-blue-800')}`}
            >
              NPW
            </div>
            <div 
              onMouseMove={(e) => handleMapMouseMove(e, '2')}
              className={`h-full w-[35%] border-y-2 border-x flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                ${getMapBerthClass('2', 'bg-sky-600 text-sky-100 border-sky-800 hover:bg-sky-500', 'bg-sky-500 text-white z-10 scale-[1.02] shadow-xl border-sky-700')}`}
            >
              NPE
            </div>
            <div 
              onMouseMove={(e) => handleMapMouseMove(e, '3')}
              className={`h-full w-[10%] border-y-2 border-r-2 border-l rounded-r flex items-center justify-center text-[8px] font-bold transition-all cursor-crosshair
                ${getMapBerthClass('3', 'bg-cyan-500 text-cyan-900 border-cyan-700 hover:bg-cyan-400', 'bg-cyan-400 text-cyan-900 z-10 scale-[1.02] shadow-xl border-cyan-600')}`}
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
              ${getMapBerthClass('6', 'bg-amber-500 text-amber-900 border-amber-700 hover:bg-amber-400', 'bg-amber-400 text-amber-900 z-10 scale-[1.02] shadow-xl border-amber-600')}`}
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
                ${getMapBerthClass('4', 'bg-emerald-600 text-emerald-100 border-emerald-800 hover:bg-emerald-500', 'bg-emerald-500 text-white z-10 scale-[1.02] shadow-xl border-emerald-700')}`}
            >
              SFW
            </div>
            <div 
              onMouseMove={(e) => handleMapMouseMove(e, '5')}
              className={`h-full w-[50%] border-y-2 border-r-2 border-l rounded-r flex items-center justify-center text-[10px] font-bold transition-all cursor-crosshair
                ${getMapBerthClass('5', 'bg-teal-500 text-teal-900 border-teal-700 hover:bg-teal-400', 'bg-teal-400 text-teal-900 z-10 scale-[1.02] shadow-xl border-teal-600')}`}
            >
              SFE
            </div>
          </div>
        </div>

        {/* Quick Legend below the map */}
        <div className="mt-4 flex-shrink-0">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-gray-600">
            {berths.map(b => (
              <div key={b.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm shadow-sm ${b.colorClass}`}></span>
                <span className="font-semibold">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
