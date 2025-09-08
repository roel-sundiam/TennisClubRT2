// Temporary fix - will replace the TypeScript function with a working JavaScript version
// that includes the static data from screenshots

const staticMemberData = [
  { name: "PJ Quiazon", jan: 790, feb: 1750, mar: 750, apr: 900, may: 1040, jun: 100, jul: 400, aug: 150, sep: 0 },
  { name: "Pauleen Aina Sengson", jan: 300, feb: 0, mar: 700, apr: 960, may: 935, jun: 1045, jul: 625, aug: 1040, sep: 100 },
  { name: "Jermin David", jan: 1250, feb: 740, mar: 1200, apr: 1500, may: 0, jun: 300, jul: 0, aug: 200, sep: 0 },
  { name: "Miguel Naguit", jan: 1490, feb: 710, mar: 1220, apr: 440, may: 300, jun: 600, jul: 200, aug: 0, sep: 0 },
  { name: "Jhen Cunanan", jan: 0, feb: 1000, mar: 1100, apr: 1100, may: 500, jun: 0, jul: 500, aug: 320, sep: 0 },
  // Add first 5 members as a test
];

const monthNames = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025'];

// Create the static data in the expected format
const rawData = staticMemberData.map(member => {
  const row = { 'Players/Members': member.name };
  let total = 0;
  
  monthNames.forEach((month, index) => {
    const monthKey = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep'][index];
    const amount = member[monthKey] || 0;
    row[month] = amount > 0 ? `₱${amount.toFixed(2)}` : '₱0.00';
    total += amount;
  });
  
  row['Total'] = `₱${total.toFixed(2)}`;
  return row;
});

console.log('Static data example:', JSON.stringify(rawData[0], null, 2));
console.log('Total members:', rawData.length);