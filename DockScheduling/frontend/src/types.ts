export interface Berth {
  id: string;
  name: string;
  length: number;
  facilities: string[];
  recommendations: string[];
  colorClass: string;
}

export interface Booking {
  id: string;
  berthId: string;
  startDate: string;
  endDate: string;
  vesselName: string;
}
