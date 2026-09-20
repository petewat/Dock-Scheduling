import { render } from '@testing-library/react';
import { BookingModal } from '../BookingModal';
import { vi } from 'vitest';

describe('BookingModal', () => {
  it('renders correctly when open', () => {
    render(<BookingModal isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} startDate="2026-10-01" endDate="2026-10-02" filterLength="100" filterBerthId="" validBerths={[{ id: '1', name: 'Pier', length: 150, facilities: [], recommendations: [], colorClass: '' }]} />);
  });

  it('does not render when closed', () => {
    render(<BookingModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} startDate="" endDate="" filterLength="" filterBerthId="" validBerths={[]} />);
  });
});
