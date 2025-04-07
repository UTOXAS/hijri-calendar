const proxyUrl = "https://script.google.com/macros/s/1TLu97O0mD8Sr8q7T0RBvt-_GchO8feMQGHunQE42NS923aQPNkH9tTNt/exec";

async function fetchHijriDateToday() {
    const cachedData = getCachedData('hijriCalendar');
    if (cachedData) {
        console.log('Using cached data');
        return cachedData;
    }

    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.error) {
        throw new Error(data.error);
    }

    const processedData = {
        hijriDay: data.hijriDay,
        hijriMonthName: data.hijriMonth,
        hijriYear: data.hijriYear,
        gregorianDate: new Date(data.gregorianDate),
        calendar: data.calendar.map(day => ({
            hijri: {
                day: day.hijri.day,
                month: day.hijri.month,
                year: day.hijri.year
            },
            gregorian: {
                day: String(day.gregorian.day),
                month: day.gregorian.month,
                year: day.gregorian.year,
                weekday: day.gregorian.weekday,
                date: new Date(`${day.gregorian.year}-${day.gregorian.month}-${day.gregorian.day.padStart(2, '0')}`)
            }
        })),
        rawHijriResponse: data.rawHijriResponse
    };

    cacheData('hijriCalendar', processedData);
    return processedData;
}