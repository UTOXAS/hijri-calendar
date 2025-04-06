// Fetch today's Hijri date from Egyptian Dar Ifta API
async function fetchDarIftaDate() {
    const url = 'http://di107.dar-alifta.org/api/HijriDate?langID=1';
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`فشل في جلب بيانات دار الإفتاء: ${response.status}`);
        const data = await response.json();
        console.log('Dar Ifta Response:', data);

        if (!data.dayHijri || !data.monthHijri || !data.yearHijri) {
            throw new Error('استجابة غير صالحة من دار الإفتاء: ' + JSON.stringify(data));
        }

        return {
            hijriDay: parseInt(data.dayHijri, 10),
            hijriMonthName: data.monthHijri,
            hijriYear: data.yearHijri,
            gregorianDate: new Date() // Today’s date
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
        const darIftaData = await fetchDarIftaDate();
        const todayHijriDay = darIftaData.hijriDay;
        const todayHijriMonth = darIftaData.hijriMonthName;
        const todayHijriYear = darIftaData.hijriYear;
        const todayGregorian = new Date();

        // Calculate days since the start of the current Hijri month
        const daysSinceMonthStart = todayHijriDay - 1;
        const gregorianStartOfCurrentMonth = new Date(todayGregorian);
        gregorianStartOfCurrentMonth.setDate(todayGregorian.getDate() - daysSinceMonthStart);

        // Hardcode Shawwal 1446 H start date for now (March 31, 2025)
        // In a real scenario, this should be dynamically fetched or validated against Dar Ifta
        const targetGregorianStart = new Date();
        if (hijriMonth === 'شَوّال' && hijriYear === '1446') {
            targetGregorianStart.setFullYear(2025, 2, 31); // March 31, 2025
        } else {
            // For other months, approximate based on today’s data and adjust
            const monthDiff = getHijriMonthDiff(todayHijriMonth, todayHijriYear, hijriMonth, hijriYear);
            targetGregorianStart.setTime(gregorianStartOfCurrentMonth.getTime() + monthDiff * 30 * 24 * 60 * 60 * 1000);
        }

        if (isNaN(targetGregorianStart.getTime())) {
            throw new Error('فشل في حساب بداية الشهر الهجري');
        }

        const result = {
            HijriDay: 1,
            HijriMonthName: hijriMonth,
            HijriYear: hijriYear,
            DaysInMonth: 30, // Fixed for simplicity; ideally fetch from Dar Ifta
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

// Helper to calculate approximate month difference (simplified)
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