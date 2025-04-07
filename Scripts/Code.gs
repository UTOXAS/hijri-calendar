function doGet(e) {
  let text = '';
  try {    
    const url = `http://di107.dar-alifta.org/api/HijriDate?langID=2`;
    const response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
    
    // Get raw content and enforce UTF-8
    text = Utilities.newBlob(response.getContent()).getDataAsString('UTF-8');
    // Remove all null chars, BOM, and quotes globally
    text = text.replace(/[\u0000-\u001F\uFEFF"]/g, '').trim();

    const parts = text.split(' ');
    if (parts.length !== 3) {
      throw new Error('Invalid response format from Dar Al-Ifta: ' + text);
    }

    // Extract day, stripping non-numeric
    const dayStr = parts[0].replace(/[^0-9]/g, '');
    const day = parseInt(dayStr, 10);
    if (isNaN(day) || dayStr === '') {
      throw new Error('Failed to parse day from response: ' + parts[0] + ' (raw: ' + text + ')');
    }

    // Clean month and year of any remaining junk
    const month = parts[1].replace(/[^A-Za-z\u0600-\u06FF]/g, '');
    const year = parts[2].replace(/[^0-9]/g, '');

    // Validate cleaned values
    if (!/^[A-Za-z\u0600-\u06FF]+$/.test(month)) {
      throw new Error('Month is not a valid name: ' + month + ' (raw: ' + text + ')');
    }
    if (!/^[0-9]+$/.test(year)) {
      throw new Error('Year is not valid: ' + year + ' (raw: ' + text + ')');
    }

    const gregorianDate = new Date();

    const result = {
      day: day,
      month: month,
      year: year,
      gregorianDate: gregorianDate.toISOString(),
      rawResponse: text
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: e.message, 
      rawResponse: text || 'N/A'
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}