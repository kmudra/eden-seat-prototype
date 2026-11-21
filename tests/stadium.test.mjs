import test from 'node:test';
import assert from 'node:assert/strict';
import {PITCH,SECTOR,getSeat,generateSectorSeats,eyePosition,seatMetrics} from '../dist/stadium-data.js';
test('Pitch uses the published dimensions',()=>assert.deepEqual(PITCH,{width:68,length:105}));
test('Every selectable place has a unique, round-trippable ID and lies outside the pitch',()=>{
  const seats=generateSectorSeats();
  assert.equal(seats.length,SECTOR.rows*SECTOR.seatsPerRow);
  assert.equal(new Set(seats.map(s=>s.id)).size,seats.length);
  for(const seat of seats) {
    assert.deepEqual(getSeat(seat.row,seat.number),seat);
    assert(seat.x>PITCH.width/2);
    assert(Math.abs(seat.z-SECTOR.centerZ)<SECTOR.width/2);
    assert(eyePosition(seat).y>seat.y+1);
    assert(seatMetrics(seat).distanceToPitch>0);
  }
});
test('Rows rise and recede, while seat numbering follows the same direction in each row',()=>{
  for(let row=1;row<SECTOR.rows;row++) {
    assert(getSeat(row+1,12).x>getSeat(row,12).x);
    assert(getSeat(row+1,12).y>getSeat(row,12).y);
  }
  for(let row=1;row<=SECTOR.rows;row++)
    for(let n=1;n<SECTOR.seatsPerRow;n++) assert(getSeat(row,n+1).z>getSeat(row,n).z);
});
test('Invalid and fractional selection cannot create fictitious seats',()=>{
  for(const row of [0,33,-1,1.5,NaN]) assert.throws(()=>getSeat(row,1),RangeError);
  for(const n of [0,25,-1,1.5,NaN]) assert.throws(()=>getSeat(1,n),RangeError);
});
