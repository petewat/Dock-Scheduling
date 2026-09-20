import { render } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { vi } from 'vitest';

describe('CalendarView', () => {
  it('renders calendar headers', () => {
    render(<CalendarView bookings={[]} activeBerths={[]} selectionStart={null} hoverDay={null} onDayClick={vi.fn()} onHoverDay={vi.fn()} todayString="2026-09-20" berths={[]} filterBerthId="" onFilterBerthIdChange={vi.fn()} filterLength="" onFilterLengthChange={vi.fn()} />);
  });
});
