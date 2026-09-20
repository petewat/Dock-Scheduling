import { Pool } from 'pg';

export class BookingService {
    constructor(private db: Pool) {}

    /**
     * Checks if a vessel name is already booked during the requested dates.
     * Used to trigger the soft-warning for the user.
     */
    async checkVesselNameOverlap(vesselName: string, startDate: string, endDate: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM reservations r
            JOIN vessels v ON r.vessel_id = v.id
            WHERE v.name = $1
            AND r.start_date <= $3
            AND r.end_date >= $2
            LIMIT 1;
        `;
        const { rows } = await this.db.query(query, [vesselName, startDate, endDate]);
        return rows.length > 0;
    }

    /**
     * Auto-assigns the smallest available berth for a given vessel.
     */
    async autoAssignBerth(
        vesselName: string, 
        vesselLength: number, 
        startDate: string, 
        endDate: string, 
        overrideWarning: boolean = false,
        buffer: number = 15,
        targetBerthId?: string,
        extraDetails?: {
            companyName?: string,
            contactName?: string,
            workNumber?: string,
            cellNumber?: string,
            email?: string,
            extraNote?: string
        }
    ) {
        const client = await this.db.connect();
        
        try {
            await client.query('BEGIN');
            
            // Step 1: Check for soft-warning if override flag is false
            if (!overrideWarning) {
                const isOverlapping = await this.checkVesselNameOverlap(vesselName, startDate, endDate);
                if (isOverlapping) {
                    await client.query('ROLLBACK');
                    return {
                        status: 'warning',
                        message: `Warning: A vessel named "${vesselName}" is already scheduled during these dates. Do you want to proceed and book them simultaneously?`
                    };
                }
            }

            // Step 2: Ensure vessel exists or create it
            // We assume a new vessel record if override is true (per user decision)
            // or if it doesn't exist.
            let vesselId: string;
            
            if (overrideWarning) {
                // Force create new
                const vRes = await client.query(
                    'INSERT INTO vessels (name, length_ft) VALUES ($1, $2) RETURNING id',
                    [vesselName, vesselLength]
                );
                vesselId = vRes.rows[0].id;
            } else {
                // Find existing or create
                const vRes = await client.query(
                    'SELECT id FROM vessels WHERE name = $1 AND length_ft = $2 LIMIT 1',
                    [vesselName, vesselLength]
                );
                if (vRes.rows.length > 0) {
                    vesselId = vRes.rows[0].id;
                } else {
                    const insertVRes = await client.query(
                        'INSERT INTO vessels (name, length_ft) VALUES ($1, $2) RETURNING id',
                        [vesselName, vesselLength]
                    );
                    vesselId = insertVRes.rows[0].id;
                }
            }
            
            const requiredLength = vesselLength + buffer;
            
            // Step 3: Find the smallest valid berth, or use targetBerthId if specified
            let bestFit;
            
            if (targetBerthId) {
                const { rows } = await client.query('SELECT id, name, max_length_ft FROM berths WHERE id = $1', [targetBerthId]);
                if (rows.length === 0) throw new Error("Target berth not found.");
                bestFit = rows[0];
            } else {
                const findQuery = `
                    SELECT id, name, max_length_ft FROM berths b 
                    WHERE b.max_length_ft >= $1 
                    AND NOT EXISTS (
                        SELECT 1 FROM reservations r 
                        WHERE r.berth_id = b.id 
                        AND r.start_date <= $3 
                        AND r.end_date >= $2
                    ) 
                    ORDER BY b.max_length_ft ASC LIMIT 1
                `;
                const { rows } = await client.query(findQuery, [requiredLength, startDate, endDate]);
                
                if (rows.length === 0) {
                    throw new Error("No available berth fits this vessel.");
                }
                bestFit = rows[0];
            }
            
            // Step 4: Create the reservation
            const insertQuery = `
                INSERT INTO reservations (
                    berth_id, vessel_id, start_date, end_date, 
                    company_name, contact_name, work_number, cell_number, email, extra_note
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
            `;
            const result = await client.query(insertQuery, [
                bestFit.id, vesselId, startDate, endDate,
                extraDetails?.companyName || null,
                extraDetails?.contactName || null,
                extraDetails?.workNumber || null,
                extraDetails?.cellNumber || null,
                extraDetails?.email || null,
                extraDetails?.extraNote || null
            ]);
            
            await client.query('COMMIT');
            
            return {
                status: 'success',
                reservation: result.rows[0],
                berth: bestFit
            };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Get bookings within a date range.
     */
    async getBookings(startDate?: string, endDate?: string) {
        let query = `
            SELECT 
                r.id, 
                r.berth_id as "berthId", 
                r.start_date as "startDate", 
                r.end_date as "endDate", 
                v.name as "vesselName"
            FROM reservations r
            JOIN vessels v ON r.vessel_id = v.id
        `;
        const params: any[] = [];
        
        if (startDate && endDate) {
            query += ` WHERE r.end_date >= $1 AND r.start_date <= $2`;
            params.push(startDate, endDate);
        }
        
        const { rows } = await this.db.query(query, params);
        
        // Format dates as YYYY-MM-DD strings to match frontend expectations
        return rows.map(r => ({
            ...r,
            startDate: new Date(r.startDate).toISOString().split('T')[0],
            endDate: new Date(r.endDate).toISOString().split('T')[0]
        }));
    }
}
