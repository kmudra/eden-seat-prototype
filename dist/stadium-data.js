// Public reference: https://www.slavia.cz/cze/fortuna-arena (pitch).
// Stand geometry and this seat numbering are deliberately approximate.
export const PITCH = Object.freeze({ width: 68, length: 105 });
export const BOWL = Object.freeze({ halfWidth: 40.5, halfLength: 59, cornerRadius: 7.5, rows: 32, rowDepth: 0.78, rowRise: 0.46, baseHeight: 1 });
export const SECTOR = Object.freeze({ number: '115', name: 'Tribuna Františka Veselého', orientation: 'Východní tribuna', centerZ: -14.7, width: 14.7, rows: 32, seatsPerRow: 24, seatSpacing: 0.55, approximate: true });
export function terrace(row) {
  if (!Number.isInteger(row) || row < 1 || row > BOWL.rows) throw new RangeError('Invalid row');
  return { x: BOWL.halfWidth + (row - 0.5) * BOWL.rowDepth, y: BOWL.baseHeight + (row - 1) * BOWL.rowRise };
}
export function getSeat(row, number) {
  if (!Number.isInteger(number) || number < 1 || number > SECTOR.seatsPerRow) throw new RangeError('Invalid seat');
  const {x,y} = terrace(row);
  return { id: `E115-R${String(row).padStart(2,'0')}-S${String(number).padStart(2,'0')}`, sector: '115', row, number, x, y, z: SECTOR.centerZ + (number - (SECTOR.seatsPerRow + 1) / 2) * SECTOR.seatSpacing, yaw: -Math.PI / 2 };
}
export function generateSectorSeats() {
  return Array.from({length: SECTOR.rows * SECTOR.seatsPerRow}, (_, i) => getSeat(Math.floor(i / SECTOR.seatsPerRow) + 1, i % SECTOR.seatsPerRow + 1));
}
export function eyePosition(seat) { return { x: seat.x, y: seat.y + 1.18, z: seat.z }; }
export function seatMetrics(seat) {
  const eye = eyePosition(seat);
  return { distanceToPitch: seat.x - PITCH.width / 2, eyeHeight: eye.y, distanceToCenter: Math.hypot(eye.x,eye.y,eye.z) };
}
