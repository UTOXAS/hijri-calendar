async function fetchHijriDateToday() {
    const proxyUrl = "https://script.google.com/macros/s/AKfycbw5YJGaV-gmeHT5w5Gow948OTEKIiFjCcMOZt2xAZhgAveSZU9VTvbNj8Qduj-5VfwO/exec";
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`فشل في جلب البيانات: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return {
            hijriDay: data.hijriDay,
            hijriMonthName: data.hijriMonth,
            hijriYear: data.hijriYear,
            calendar: data.calendar.map(day => ({
                hijri: day.hijri,
                gregorian: {
                    ...day.gregorian,
                    date: new Date(`${day.gregorian.year}-${day.gregorian.month}-${day.gregorian.day.padStart(2, '0')}`)
                }
            }))
        };
    } catch (error) {
        console.error('خطأ في جلب التاريخ:', error.message);
        throw error;
    }
}