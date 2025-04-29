// Calculate Levenshtein distance between two strings
function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return matrix[b.length][a.length];
}

// Normalize string by removing diacritics and converting to lowercase
function normalizeString(str) {
  return str
    .normalize('NFD') // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric
}

function doGet(e) {
  let hijriText = '';
  try {
    // Fetch current Hijri date from Dar Al-Ifta
    const hijriUrl = 'http://di107.dar-alifta.org/api/HijriDate?langID=2';
    const hijriResponse = UrlFetchApp.fetch(hijriUrl, { 'muteHttpExceptions': true });
    if (hijriResponse.getResponseCode() !== 200) {
      throw new Error('Failed to fetch Dar Al-Ifta data: ' + hijriResponse.getResponseCode());
    }
    hijriText = Utilities.newBlob(hijriResponse.getContent(), 'application/octet-stream')
      .getDataAsString('UTF-8')
      .replace(/[-\u001F\uFEFF\uFFFD"]/g, '')
      .trim();

    const hijriParts = hijriText.split(' ');
    if (hijriParts.length !== 3) {
      throw new Error('Invalid Hijri response format: ' + hijriText);
    }

    const hijriDay = parseInt(hijriParts[0].replace(/[^0-9]/g, ''), 10);
    const hijriMonth = hijriParts[1].replace(/[^A-Za-z\u0600-\u06FF]/g, '');
    const hijriYear = hijriParts[2].replace(/[^0-9]/g, '');

    if (isNaN(hijriDay) || !/^[A-Za-z\u0600-\u06FF]+$/.test(hijriMonth) || !/^[0-9]+$/.test(hijriYear)) {
      throw new Error('Invalid Hijri data parsing: ' + hijriText);
    }

    // Map Hijri month to numeric index (1-12)
    const monthMap = {
      'مُحَرَّم': 1, 'صَفَر': 2, 'رَبيع الأوَّل': 3, 'رَبيع الثاني': 4,
      'جُمادى الأولى': 5, 'جُمادى الآخرة': 6, 'رَجَب': 7, 'شَعْبان': 8,
      'رَمَضان': 9, 'شَوّال': 10, 'ذو القَعدة': 11, 'ذو الحِجَّة': 12,
      'Muharram': 1, 'Safar': 2, 'RabiealAwwal': 3, 'RabiealThani': 4,
      'JumadaalAwwal': 5, 'JumadaalThani': 6, 'Rajab': 7, 'Saban': 8,
      'Ramadan': 9, 'Shawwal': 10, 'DhulQida': 11, 'DhulHijja': 12,
      'DhualQidah': 11, 'DhualHijjah': 12, 'Dhu-al-Qi\'dah': 11, 'Dhu-al-Hijjah': 12
    };

    let monthIndex = monthMap[hijriMonth];
    if (!monthIndex) {
      // Try fuzzy matching
      const normalizedInput = normalizeString(hijriMonth);
      let minDistance = Infinity;
      let closestMonth = null;
      for (const month in monthMap) {
        const normalizedMonth = normalizeString(month);
        const distance = levenshteinDistance(normalizedInput, normalizedMonth);
        if (distance < minDistance) {
          minDistance = distance;
          closestMonth = month;
        }
      }
      if (minDistance <= 3) { // Threshold for acceptable match
        monthIndex = monthMap[closestMonth];
        Logger.log(`Fuzzy matched month: ${hijriMonth} -> ${closestMonth} (distance: ${minDistance})`);
      } else {
        Logger.log(`No match found for month: ${hijriMonth}`);
        throw new Error('Unknown Hijri month: ' + hijriMonth);
      }
    }

    // Fetch unadjusted Aladhan calendar for the month
    const aladhanUrl = `https://api.aladhan.com/v1/hToGCalendar/${monthIndex}/${hijriYear}?calendarMethod=MATHEMATICAL&adjustment=0`;
    const aladhanResponse = UrlFetchApp.fetch(aladhanUrl, { 'muteHttpExceptions': true });
    if (aladhanResponse.getResponseCode() !== 200) {
      throw new Error('Failed to fetch Aladhan data: ' + aladhanResponse.getResponseCode());
    }
    const aladhanData = JSON.parse(aladhanResponse.getContentText('UTF-8')).data;

    // Calculate adjustment
    const todayGregorian = new Date();
    const unadjustedGregorian = new Date(aladhanData[hijriDay - 1].gregorian.date.split('-').reverse().join('-'));
    const adjustment = Math.round((todayGregorian - unadjustedGregorian) / (1000 * 60 * 60 * 24));

    // Fetch adjusted calendar
    const adjustedUrl = `https://api.aladhan.com/v1/hToGCalendar/${monthIndex}/${hijriYear}?calendarMethod=MATHEMATICAL&adjustment=${adjustment}`;
    const adjustedResponse = UrlFetchApp.fetch(adjustedUrl, { 'muteHttpExceptions': true });
    if (adjustedResponse.getResponseCode() !== 200) {
      throw new Error('Failed to fetch adjusted Aladhan data: ' + adjustedResponse.getResponseCode());
    }
    const finalAladhanData = JSON.parse(adjustedResponse.getContentText('UTF-8')).data;

    const result = {
      hijriDay: hijriDay,
      hijriMonth: hijriMonth,
      hijriYear: hijriYear,
      gregorianDate: todayGregorian.toISOString(),
      calendar: finalAladhanData.map(day => ({
        hijri: {
          day: parseInt(day.hijri.day, 10),
          month: day.hijri.month.ar,
          year: day.hijri.year
        },
        gregorian: {
          day: parseInt(day.gregorian.day, 10),
          month: day.gregorian.month.en,
          year: day.gregorian.year,
          weekday: day.gregorian.weekday.en
        }
      })),
      rawHijriResponse: hijriText
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    Logger.log(`Error: ${e.message}, Raw Response: ${hijriText || 'N/A'}`);
    return ContentService.createTextOutput(JSON.stringify({ 
      error: e.message, 
      rawResponse: hijriText || 'N/A'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}