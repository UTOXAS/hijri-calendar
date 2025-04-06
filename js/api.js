// Fetch today's Hijri date from Dar Al-Ifta via Google Apps Script proxy
async function fetchHijriDateToday() {
    const proxyUrl = 'https://script.google.com/macros/s/AKfycbwQ9Q1WvIEQU_m4HFhAMrW0p3-FeukqDRlWqIR8Ewbeg_lEN52euJwoAXp3wIewGtkC/exec'; // Replace with your deployed URL
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`فشل في جلب بيانات دار الإفتاء: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        console.log('Dar Al-Ifta Response:', data);

        // Decode potentially garbled strings
        const decodeString = (str) => {
            try {
                return decodeURIComponent(escape(str));
            } catch (e) {
                return str; // Return original if decoding fails
            }
        };

        return {
            hijriDay: data.day !== null && !isNaN(data.day) ? data.day : 1, // Fallback to 1 if null or invalid
            hijriMonthName: decodeString(data.month),
            hijriYear: decodeString(data.year),
            gregorianDate: new Date(data.gregorianDate)
        };
    } catch (error) {
        console.error('خطأ في جلب تاريخ دار الإفتاء:', error.message);
        throw error;
    }
}

// Fetch Hijri month data for a specific Hijri month and year
async function fetchHijriDate(hijriMonth, hijriYear) {
    const cacheKey = `hijriDate_${hijriMonth}_${hijriYear}`;
    let cachedData = getCachedData(cacheKey);
    if (cachedData) {
        if (cachedData.GregorianStart) {
            cachedData.GregorianStart = new Date(cachedData.GregorianStart);
            if (!isNaN(cachedData.GregorianStart.getTime())) {
                return cachedData;
            }
            console.warn('Cached GregorianStart is invalid, refetching:', cachedData);
        }
    }

    try {
        const todayData = await fetchHijriDateToday();
        const todayHijriDay = todayData.hijriDay;
        const todayHijriMonth = todayData.hijriMonthName;
        const todayHijriYear = todayData.hijriYear;
        const todayGregorian = todayData.gregorianDate;

        // Validate input data
        if (!todayHijriDay || !todayHijriMonth || !todayHijriYear || !todayGregorian) {
            throw new Error('بيانات اليوم الحالي غير صالحة');
        }

        // Calculate Gregorian start of current Hijri month
        const daysSinceMonthStart = todayHijriDay - 1;
        const gregorianStartOfCurrentMonth = new Date(todayGregorian);
        gregorianStartOfCurrentMonth.setDate(todayGregorian.getDate() - daysSinceMonthStart);

        // Adjust to target month
        const monthDiff = getHijriMonthDiff(todayHijriMonth, todayHijriYear, hijriMonth, hijriYear);
        const targetGregorianStart = new Date(gregorianStartOfCurrentMonth);
        targetGregorianStart.setTime(gregorianStartOfCurrentMonth.getTime() + monthDiff * 29.5 * 24 * 60 * 60 * 1000);

        if (isNaN(targetGregorianStart.getTime())) {
            throw new Error('فشل في حساب بداية الشهر الهجري');
        }

        const result = {
            HijriDay: 1,
            HijriMonthName: hijriMonth,
            HijriYear: hijriYear,
            DaysInMonth: 30, // Approximation, as Dar Al-Ifta provides no month length
            GregorianStart: targetGregorianStart.toISOString()
        };

        cacheData(cacheKey, result);
        return {
            ...result,
            GregorianStart: new Date(result.GregorianStart)
        };
    } catch (error) {
        console.error('خطأ في جلب التاريخ الهجري:', error.message);
        throw error;
    }
}

// Helper to calculate approximate month difference
function getHijriMonthDiff(currentMonth, currentYear, targetMonth, targetYear) {
    const hijriMonths = [
        'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
        'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
    ];
    const currentIndex = hijriMonths.indexOf(currentMonth);
    const targetIndex = hijriMonths.indexOf(targetMonth);
    if (currentIndex === -1 || targetIndex === -1) {
        throw new Error('اسم الشهر غير صالح');
    }
    const yearDiff = parseInt(targetYear) - parseInt(currentYear);
    return (yearDiff * 12) + (targetIndex - currentIndex);
}