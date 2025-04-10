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
      .replace(/[\u0000-\u001F\uFEFF\uFFFD"]/g, '')
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
      'Muharram': 1, 'Safar': 2, 'Rabie’ al-Awwal': 3, 'Rabie’ al-Thani': 4,
      'Jumada al-Awwal': 5, 'Jumada al-Thani': 6, 'Rajab': 7, 'Sa’ban': 8,
      'Ramadan': 9, 'Shawwal': 10, 'Dhul-Qi’da': 11, 'Dhul-Hijja': 12
  };
    const monthIndex = monthMap[hijriMonth];
    if (!monthIndex) throw new Error('Unknown Hijri month: ' + hijriMonth);

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
    return ContentService.createTextOutput(JSON.stringify({ 
      error: e.message, 
      rawResponse: hijriText || 'N/A'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}