async function fetchHijriDateToday() {
    const proxyUrl = "https://script.google.com/macros/s/AKfycbwS-S38F2r6G7tFTULVceS4DhpfGDgN9X659LpP1nJyfJuUqcU1FKxuIQh5eocjUnWs/exec";
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`ÙØ´Ù„ ÙÙŠ Ø¬Ù„Ø¨ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª: ${response.status}`);
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
        console.error('Ø®Ø·Ø£ ÙÙŠ Ø¬Ù„Ø¨ Ø§Ù„ØªØ§Ø±ÙŠØ®:', error.message);
        throw error;
    }
}
