// Fetch today's Hijri date from Aladhan API and adjust to Dar Al-Ifta
async function fetchHijriDateToday() {
    const url = 'https://api.aladhan.com/v1/gToH';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`فشل في جلب بيانات Aladhan: ${response.status}`);
        const data = await response.json();
        console.log('Aladhan Response:', data);

        const hijri = data.data.hijri;
        let hijriDay = parseInt(hijri.day, 10);
        let hijriMonthName = hijri.month.ar;
        let hijriYear = hijri.year;
        const today = new Date(); // April 6, 2025, per context

        // Adjust to match Dar Al-Ifta: "7 شوال 1446" = April 6, 2025
        const darIftaReferenceDate = new Date('2025-04-06'); // 7 Shawwal 1446
        const darIftaHijriDay = 7;
        const darIftaHijriMonth = 'شَوّال';
        const darIftaHijriYear = '1446';

        // Calculate Gregorian start of Aladhan’s current month
        const aladhanMonthStart = new Date(today);
        aladhanMonthStart.setDate(today.getDate() - (hijriDay - 1));

        // Dar Al-Ifta’s month start: 1 Shawwal 1446 = March 29, 2025
        const darIftaMonthStart = new Date('2025-03-29');
        const dayOffset = Math.round((darIftaReferenceDate - aladhanMonthStart) / (1000 * 60 * 60 * 24)) - (darIftaHijriDay - hijriDay);

        hijriDay += dayOffset;
        const hijriMonths = [
            'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
            'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
        ];
        let monthIndex = hijriMonths.indexOf(hijriMonthName);
        let year = parseInt(hijriYear);

        while (hijriDay > 30) {
            hijriDay -= 30;
            monthIndex++;
            if (monthIndex > 11) {
                monthIndex = 0;
                year++;
            }
        }
        while (hijriDay < 1) {
            hijriDay += 30;
            monthIndex--;
            if (monthIndex < 0) {
                monthIndex = 11;
                year--;
            }
        }

        hijriMonthName = hijriMonths[monthIndex];
        hijriYear = year.toString();

        return {
            hijriDay,
            hijriMonthName,
            hijriYear,
            gregorianDate: today
        };
    } catch (error) {
        console.error('خطأ في جلب تاريخ Aladhan:', error.message);
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
        const todayGregorian = new Date();

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
            DaysInMonth: 30, // Approximation
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
    const yearDiff = parseInt(targetYear) - parseInt(currentYear);
    return (yearDiff * 12) + (targetIndex - currentIndex);
}