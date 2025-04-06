// Fetch today's Hijri date from Dar Al-Ifta via Google Apps Script proxy
async function fetchHijriDateToday() {
    const proxyUrl = 'https://script.google.com/macros/s/AKfycbxuqJkRj9BOGHh2Cc0Sm4JqQXNcqZXmUTTPmi_xr91_8d2m6f_7JEBDfptUdOGINefa/exec';
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`فشل في جلب بيانات دار الإفتاء: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const monthNameMap = {
            'Muharram': 'مُحَرَّم',
            'Safar': 'صَفَر',
            'Rabie’ al-Awwal': 'رَبيع الأوَّل',
            'Rabie’ al-Thani': 'رَبيع الثاني',
            'Jumada al-Awwal': 'جُمادى الأولى',
            'Jumada al-Thani': 'جُمادى الآخرة',
            'Rajab': 'رَجَب',
            'Sa’ban': 'شَعْبان',
            'Ramadan': 'رَمَضان',
            'Shawwal': 'شَوّال',
            'Dhul-Qi’da': 'ذو القَعدة',
            'Dhul-Hijja': 'ذو الحِجَّة'
        };

        const monthName = data.month;
        const arabicMonthName = monthNameMap[monthName] || monthName;

        return {
            hijriDay: parseInt(data.day),
            hijriMonthName: arabicMonthName,
            hijriYear: data.year,
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
    if (cachedData && !isNaN(new Date(cachedData.GregorianStart).getTime())) {
        cachedData.GregorianStart = new Date(cachedData.GregorianStart);
        return cachedData;
    }

    try {
        const todayData = await fetchHijriDateToday();
        const hijriMonths = [
            'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
            'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
        ];
        const targetMonthIndex = hijriMonths.indexOf(hijriMonth);
        if (targetMonthIndex === -1) throw new Error('اسم الشهر غير صالح');

        // Fetch Aladhan calendar for the year (for month length only)
        const aladhanUrl = `http://api.aladhan.com/v1/hijriCalendarByYear?year=${hijriYear}`;
        const response = await fetch(aladhanUrl);
        if (!response.ok) throw new Error(`فشل في جلب بيانات Aladhan: ${response.status}`);
        const aladhanData = await response.json();
        const months = aladhanData.data;

        const monthData = months[targetMonthIndex];
        const daysInMonth = monthData.length;
        let gregorianStart;

        // Get today’s exact Hijri and Gregorian from Dar Al-Ifta
        const todayHijriDay = todayData.hijriDay;
        const todayMonthIndex = hijriMonths.indexOf(todayData.hijriMonthName);
        const todayYear = todayData.hijriYear;
        const todayGregorian = new Date(todayData.gregorianDate);
        todayGregorian.setHours(0, 0, 0, 0); // Normalize to start of day

        if (hijriYear === todayYear && targetMonthIndex === todayMonthIndex) {
            // For current month, calculate start from Dar Al-Ifta’s today
            gregorianStart = new Date(todayGregorian);
            gregorianStart.setDate(todayGregorian.getDate() - (todayHijriDay - 1));
        } else {
            // For other months, use Aladhan’s first day and adjust relative to Dar Al-Ifta
            const firstDayData = monthData.days[0];
            gregorianStart = new Date(`${firstDayData.gregorian.date} ${hijriYear}`);
            if (hijriYear === todayYear) {
                // Adjust based on Dar Al-Ifta’s current date
                const monthDiff = targetMonthIndex - todayMonthIndex;
                let dayOffset = -(todayHijriDay - 1); // Back to start of current month
                for (let i = 0; i < Math.abs(monthDiff); i++) {
                    const monthIndex = todayMonthIndex + (monthDiff > 0 ? i : -i - 1);
                    dayOffset += monthDiff > 0 ? months[monthIndex].length : -months[monthIndex].length;
                }
                gregorianStart = new Date(todayGregorian);
                gregorianStart.setDate(todayGregorian.getDate() + dayOffset);
            }
        }

        if (isNaN(gregorianStart.getTime())) {
            throw new Error('فشل في حساب بداية الشهر الهجري');
        }

        const result = {
            HijriDay: 1,
            HijriMonthName: hijriMonth,
            HijriYear: hijriYear,
            DaysInMonth: daysInMonth,
            GregorianStart: gregorianStart.toISOString()
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