// Utility to parse uploaded Excel training file into standard rows.
const xlsx = require('xlsx');

function parseTrainingExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  // Expected exact headers for beginner-friendly and predictable mapping.
  return rows.map((row) => ({
    dayOfWeek: row.dayOfWeek,
    timeOfDay: row.timeOfDay,
    avgDailySales: row.avgDailySales,
    foodType: row.foodType,
    eventDay: row.eventDay,
    platesRequired: row.platesRequired
  }));
}

module.exports = {
  parseTrainingExcel
};
