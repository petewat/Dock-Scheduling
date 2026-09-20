import { BookingService } from '../bookingService';
import { Pool } from 'pg';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('BookingService', () => {
  let pool: any;
  let service: BookingService;

  beforeEach(() => {
    pool = new Pool();
    service = new BookingService(pool);
    jest.clearAllMocks();
  });

  it('should return bookings mapped correctly', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, berthId: '1', startDate: '2026-09-20T00:00:00Z', endDate: '2026-09-21T00:00:00Z', vesselName: 'Test Vessel' }
      ]
    });

    const bookings = await service.getBookings();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].startDate).toBe('2026-09-20');
  });

  it('should throw error if no berth available', async () => {
    const mClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValueOnce(mClient);

    mClient.query.mockResolvedValueOnce({}); // BEGIN
    mClient.query.mockResolvedValueOnce({ rows: [] }); // check overlap -> no overlap
    mClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // get vessel
    mClient.query.mockResolvedValueOnce({ rows: [] }); // find valid berths -> none

    await expect(service.autoAssignBerth('Ship', 100, '2026-09-20', '2026-09-21'))
      .rejects.toThrow('No available berth fits this vessel.');
  });
});
