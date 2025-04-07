function doGet(e) {
  let hijriText = '';
  try {    
    // Fetch Hijri date from Dar Al-Ifta
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

    // Fetch Aladhan calendar for the year
    const aladhanUrl = `https://api.aladhan.com/v1/hijriCalendarByYear?year=${hijriYear}`;
    const aladhanResponse = UrlFetchApp.fetch(aladhanUrl, { 'muteHttpExceptions': true });
    const aladhanText = aladhanResponse.getContentText('UTF-8');
    const aladhanData = JSON.parse(aladhanText).data;

    const gregorianDate = new Date();

    const result = {
      hijriDay: hijriDay,
      hijriMonth: hijriMonth,
      hijriYear: hijriYear,
      gregorianDate: gregorianDate.toISOString(),
      aladhanCalendar: aladhanData,
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