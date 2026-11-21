export const WORLD = { width: 3400, height: 2600, block: 400, road: 112 };
export const VIEW = { width: 1280, height: 720 };
export const CAR_TYPES = [
  { name: 'Civic', color: '#5a9ea1', speed: 310, value: 900 },
  { name: 'Meter taxi', color: '#efb53c', speed: 285, value: 1200 },
  { name: 'Ranch pickup', color: '#b8c0b8', speed: 255, value: 1600 },
  { name: 'Comet sport', color: '#d95748', speed: 380, value: 4200 },
  { name: 'Parcel van', color: '#d5d2c3', speed: 225, value: 2100 },
  { name: 'Harbor patrol', color: '#e8e4ce', speed: 330, value: 3200 },
  { name: 'Switchback bike', color: '#61a75d', speed: 355, value: 1800 },
  { name: 'Skiff', color: '#d1e2d8', speed: 280, value: 2500 }
];
export const MISSIONS = [
  { name: 'Last Light', giver: 'Inez Vale', type: 'drive', brief: 'Take Inez across the canal before the patrol closes the bridge.', objective: 'Reach the blue marker in a vehicle', payout: 650 },
  { name: 'Quiet Till', giver: 'Milo Rusk', type: 'robbery', brief: 'Clear the corner market register, then leave the block.', objective: 'Enter the market and hold E at the till', payout: 900 },
  { name: 'Wake Line', giver: 'Nico Sol', type: 'boat', brief: 'Run Nico’s skiff through the south channel and lose the tail.', objective: 'Board a boat and reach the channel marker', payout: 1250 },
  { name: 'Meter Running', giver: 'June Park', type: 'taxi', brief: 'Work the waterfront route and bring two fares home.', objective: 'Collect two passenger fares', payout: 800 },
  { name: 'Cold Ledger', giver: 'Sera Knox', type: 'deal', brief: 'A weapons exchange has turned loud. Get the case out.', objective: 'Recover the case near the freight shed', payout: 1650 },
  { name: 'Salt Sprint', giver: 'Cal Voss', type: 'race', brief: 'Beat Cal along the seawall without folding the car.', objective: 'Reach the finish in a vehicle', payout: 2100 },
  { name: 'Breakwater', giver: 'Dani Quill', type: 'rescue', brief: 'Reach the marina office and bring Dani back to the safehouse.', objective: 'Find Dani at the marina', payout: 2750 },
  { name: 'Blue Hour', giver: 'Inez Vale', type: 'heist', brief: 'Move the harbor bonds before the city wakes up.', objective: 'Drive to the bonded warehouse', payout: 6500 }
];
export const SAVE_KEY = 'meridian-heat.slot.1';
