function doGet(e) {
  let hijriText = '';
  try {
    // Fetch current Hijri date from Dar Al-Ifta
    const hijriUrl = 'http://di107.dar-alifta.org/api/HijriDate?langID=2';
    const hijriResponse = UrlFetchApp.fetch(hijriUrl, { 'muteHttpExceptions': true });
    hijriText = Utilities.newBlob(hijriResponse.getContent()).getDataAsString('UTF-8')
      .replace(/[\u0000-\u001F\uFEFF"]/g, '')
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
      'مُحَرَّم': 1, 'صَفَر': 2, 'رَبيع الأوَّل': 3, 'رَبيع الثاني': 4,
      'جُمادى الأولى': 5, 'جُمادى الآخرة': 6, 'رَجَب': 7, 'شَعْبان': 8,
      'رَمَضان': 9, 'شَوّال': 10, 'ذو القَعدة': 11, 'ذو الحِجَّة': 12,
      'Muharram': 1, 'Safar': 2, 'RabiealAwwal': 3, 'RabiealThani': 4,
      'JumadaalAwwal': 5, 'JumadaalThani': 6, 'Rajab': 7, 'Saban': 8,
      'Ramadan': 9, 'Shawwal': 10, 'DhulQida': 11, 'DhulHijja': 12
    };
    const monthIndex = monthMap[hijriMonth];
    if (!monthIndex) throw new Error('Unknown Hijri month: ' + hijriMonth);

    // Fetch unadjusted Aladhan calendar for the month
    const aladhanUrl = `https://api.aladhan.com/v1/hToGCalendar/${monthIndex}/${hijriYear}?calendarMethod=MATHEMATICAL&adjustment=0`;
    const aladhanResponse = UrlFetchApp.fetch(aladhanUrl, { 'muteHttpExceptions': true });
    const aladhanText = aladhanResponse.getContentText('UTF-8');
    const aladhanData = JSON.parse(aladhanText).data;

    // Calculate adjustment based on Dar Al-Ifta’s current date
    const todayGregorian = new Date();
    const unadjustedGregorian = new Date(aladhanData[hijriDay - 1].gregorian.date + ' ' + todayGregorian.getFullYear());
    const adjustment = Math.round((todayGregorian - unadjustedGregorian) / (1000 * 60 * 60 * 24));

    // Fetch adjusted calendar if adjustment is needed
    let finalAladhanData = aladhanData;
    if (adjustment !== 0) {
      const adjustedUrl = `https://api.aladhan.com/v1/hToGCalendar/${monthIndex}/${hijriYear}?calendarMethod=MATHEMATICAL&adjustment=${adjustment}`;
      const adjustedResponse = UrlFetchApp.fetch(adjustedUrl, { 'muteHttpExceptions': true });
      finalAladhanData = JSON.parse(adjustedResponse.getContentText('UTF-8')).data;
    }

    const daysInMonth = finalAladhanData.length;
    const gregorianStart = new Date(finalAladhanData[0].gregorian.date + ' ' + todayGregorian.getFullYear());

    const result = {
      hijriDay: hijriDay,
      hijriMonth: hijriMonth,
      hijriYear: hijriYear,
      gregorianDate: todayGregorian.toISOString(),
      daysInMonth: daysInMonth,
      gregorianStart: gregorianStart.toISOString(),
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