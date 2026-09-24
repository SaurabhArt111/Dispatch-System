/**
 * Mock System 1 service.
 * Simulates the external Delivery Challan (DC) source system so the
 * Dispatch Management System can be developed/tested without the real System 1.
 *
 * In production, set USE_MOCK_SYSTEM1=false and point SYSTEM1_API_URL / SYSTEM1_API_KEY
 * at the real System 1 API (see services/system1Service.js).
 */

const CUSTOMERS = [
  { billTo: 'ABC INTERIORS', billAddress: 'Ring Road, Surat, GJ', billGSTIN: '24AAAAA1111A1Z5' },
  { billTo: 'SHREE DECOR HUB', billAddress: 'GIDC, Vapi, GJ', billGSTIN: '24BBBBB2222B1Z6' },
  { billTo: 'ROYAL FURNISH', billAddress: 'Sector 12, Gandhinagar, GJ', billGSTIN: '24CCCCC3333C1Z7' },
  { billTo: 'MODERN SPACES LLP', billAddress: 'MG Road, Vadodara, GJ', billGSTIN: '24DDDDD4444D1Z8' }
];

const ITEMS = [
  { itemName: 'BURL LAMINATE', screenName: '1mm Glossy' },
  { itemName: 'TEAK VENEER SHEET', screenName: 'Natural Finish' },
  { itemName: 'HIGH GLOSS ACRYLIC', screenName: '18mm' },
  { itemName: 'PVC EDGE BAND', screenName: '2mm White' },
  { itemName: 'DECORATIVE LAMINATE', screenName: '0.8mm Matte' }
];

const GODOWN_CODES = ['S-28', 'S-17', 'S-04'];
const MISTRIES = ['Ramesh Bhai', 'Suresh Bhai', 'Jignesh Bhai', ''];

let counter = 1000;

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generates one fake DC payload shaped exactly like what System 1 would send. */
function generateMockDC() {
  counter += 1;
  const customer = rand(CUSTOMERS);
  const numItems = 1 + Math.floor(Math.random() * 3);
  const items = Array.from({ length: numItems }).map(() => {
    const item = rand(ITEMS);
    return {
      screenName: item.screenName,
      itemName: item.itemName,
      qty: 5 + Math.floor(Math.random() * 40),
      godown: rand(GODOWN_CODES)
    };
  });

  return {
    sourceId: `SYS1-${Date.now()}-${counter}`,
    dcNumber: `DC-2026-${String(counter).padStart(5, '0')}`,
    dcDate: new Date().toISOString(),
    billTo: customer.billTo,
    billAddress: customer.billAddress,
    billGSTIN: customer.billGSTIN,
    deliveryType: Math.random() > 0.5 ? 'PARTY_VEHICLE' : 'COMPANY_VEHICLE',
    mistry: rand(MISTRIES),
    items
  };
}

/** Simulates "GET /dc?since=" polling endpoint of System 1 */
function fetchRecentDCs(count = 3) {
  return Array.from({ length: count }).map(() => generateMockDC());
}

module.exports = { generateMockDC, fetchRecentDCs };
