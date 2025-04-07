const proxyUrl = "https://script.google.com/macros/s/AKfycbziwEHr3sbnwKqV5A60-hXsb23oz1jje2SARY1Ci1eCWERDEjwS7MBGKq1hsQhzAU8Z/exec";

async function fetchHijriDateToday() {
    const cachedData = getCachedData('hijriCalendar');
    if (cachedData) {
        console.log('Using cached data');
        // Reconstruct Date objects from cached strings
        cachedData.gregorianDate = new Date(cachedData.gregorianDate);
        cachedData.calendar = cachedData.calendar.map(day => ({
            ...day,
            gregorian: {
                ...day.gregorian,
                date: new Date(day.gregorian.date)
            }
        }));
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
        calendar: data.calendar.map(day => {
            const gregorianDayStr = String(day.gregorian.day); // Convert to string once
            return {
                hijri: {
                    day: day.hijri.day,
                    month: day.hijri.month,
                    year: day.hijri.year
                },
                gregorian: {
                    day: gregorianDayStr, // Use string value here
                    month: day.gregorian.month,
                    year: day.gregorian.year,
                    weekday: day.gregorian.weekday,
                    date: new Date(`${day.gregorian.year}-${day.gregorian.month}-${gregorianDayStr.padStart(2, '0')}`) // Use string value with padStart
                }
            };
        }),
        rawHijriResponse: data.rawHijriResponse
    };

    cacheData('hijriCalendar', processedData);
    return processedData;
}