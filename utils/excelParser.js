// Utility to parse uploaded Excel training file into standard rows.
// Supports text-based columns and multiple header naming styles.
const xlsx = require('xlsx');

function getValueByAliases(row, aliases) {
  const foundKey = Object.keys(row).find((key) => aliases.includes(String(key).trim().toLowerCase()));
  return foundKey ? row[foundKey] : '';
}

function parseTrainingExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  return rows.map((row) => ({
    dayOfWeek: getValueByAliases(row, ['dayofweek', 'day_of_week', 'day', 'weekday']),
    timeOfDay: getValueByAliases(row, ['timeofday', 'time_of_day', 'time', 'meal', 'mealtype']),
    avgDailySales: getValueByAliases(row, ['avgdailysales', 'avg_daily_sales', 'averagedailysales', 'average_sales']),
    foodType: getValueByAliases(row, ['foodtype', 'food_type', 'itemtype', 'typeoffood']),
    eventDay: getValueByAliases(row, ['eventday', 'event_day', 'event', 'specialday']),
    platesRequired: getValueByAliases(row, ['platesrequired', 'plates_required', 'requiredplates', 'target'])
  }));
}

module.exports = {
  parseTrainingExcel
};
