import { render, screen } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { vi } from 'vitest';

describe('CalendarView', () => {
  it('renders calendar headers', () => {
    render(<CalendarView bookings={[]} activeBerths={[]} selectionStart={null} hoverDay={null} onDayClick={vi.fn()} onHoverDay={vi.fn()} todayString="2026-09-20" />);
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
  });
});
