// Fetch today's Hijri date from Dar Al-Ifta via Google Apps Script proxy
async function fetchHijriDateToday() {
    const proxyUrl = 'AKfycbxuqJkRj9BOGHh2Cc0Sm4JqQXNcqZXmUTTPmi_xr91_8d2m6f_7JEBDfptUdOGINefa'; // Replace with your deployed URL
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

        // Map English month names to Arabic
        const monthNameMap = {
            'Muharram': 'مُحَرَّم',
            'Safar': 'صَفَر',
            'Rabi‘al-Awwal': 'رَبيع الأوَّل',
            'Rabi‘ath-Thani': 'رَبيع الثاني',
            'Jumada al-Ula': 'جُمادى الأولى',
            'Jumada al-Akhirah': 'جُمادى الآخرة',
            'Rajab': 'رَجَب',
            'Sha‘ban': 'شَعْبان',
            'Ramadan': 'رَمَضان',
            'Shawwal': 'شَوّال',
            'Dhu al-Qa‘dah': 'ذو القَعدة',
            'Dhu al-Hijjah': 'ذو الحِجَّة'
        };

        const monthName = decodeString(data.month);
        const arabicMonthName = monthNameMap[monthName] || monthName;

        return {
            hijriDay: data.day !== null && !isNaN(data.day) ? data.day : 1,
            hijriMonthName: arabicMonthName,
            hijriYear: decodeString(data.year),
            gregorianDate: new Date(data.gregorianDate)
        };
    } catch (error) {
        console.error('خطأ في جلب تاريخ دار الإفتاء:', error.message);
        throw error;
    }
}

// Fetch Hijri month data for a specific Hijri month and year using Aladhan API
async function fetchHijriDate(hijriMonth, hijriYear) {
    const cacheKey = `hijriDate_${hijriMonth}_${hijriYear}`;
    let cachedData = getCachedData(cacheKey);
    if (cachedData) {
        cachedData.GregorianStart = new Date(cachedData.GregorianStart);
        if (!isNaN(cachedData.GregorianStart.getTime())) {
            return cachedData;
        }
        console.warn('Cached GregorianStart is invalid, refetching:', cachedData);
    }

    try {
        // Get today's data from Dar Al-Ifta
        const todayData = await fetchHijriDateToday();
        const todayHijriDay = todayData.hijriDay;
        const todayHijriMonth = todayData.hijriMonthName;
        const todayHijriYear = todayData.hijriYear;
        const todayGregorian = todayData.gregorianDate;

        if (!todayHijriDay || !todayHijriMonth || !todayHijriYear || !todayGregorian) {
            throw new Error('بيانات اليوم الحالي غير صالحة');
        }

        // Fetch Hijri calendar for the target year from Aladhan API
        const aladhanUrl = `http://api.aladhan.com/v1/hijriCalendarByYear?year=${hijriYear}`;
        const aladhanResponse = await fetch(aladhanUrl);
        if (!aladhanResponse.ok) throw new Error(`فشل في جلب بيانات Aladhan: ${aladhanResponse.status}`);
        const aladhanData = await aladhanResponse.json();
        const months = aladhanData.data;

        // Hijri months array for indexing
        const hijriMonths = [
            'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
            'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
        ];

        const currentMonthIndex = hijriMonths.indexOf(todayHijriMonth);
        const targetMonthIndex = hijriMonths.indexOf(hijriMonth);
        const yearDiff = parseInt(hijriYear) - parseInt(todayHijriYear);

        if (currentMonthIndex === -1 || targetMonthIndex === -1) {
            throw new Error('اسم الشهر غير صالح');
        }

        // Calculate total days between today and target month start
        let totalDaysOffset = -(todayHijriDay - 1); // Days back to start of current month
        for (let y = 0; y < Math.abs(yearDiff); y++) {
            const yearToFetch = parseInt(todayHijriYear) + (yearDiff > 0 ? y : -y - 1);
            const yearData = await fetch(aladhanUrl.replace(hijriYear, yearToFetch)).then(res => res.json());
            yearData.data.forEach(month => {
                totalDaysOffset += yearDiff > 0 ? month.length : -month.length;
            });
        }

        if (yearDiff === 0) {
            totalDaysOffset += (targetMonthIndex - currentMonthIndex) * 30; // Rough estimate within same year
        } else {
            const targetYearMonths = months;
            for (let i = 0; i < targetMonthIndex; i++) {
                totalDaysOffset += targetYearMonths[i].length;
            }
            for (let i = 0; i < currentMonthIndex; i++) {
                totalDaysOffset -= months[i].length;
            }
        }

        // Calculate Gregorian start of target month
        const targetGregorianStart = new Date(todayGregorian);
        targetGregorianStart.setDate(todayGregorian.getDate() + totalDaysOffset);

        if (isNaN(targetGregorianStart.getTime())) {
            throw new Error('فشل في حساب بداية الشهر الهجري');
        }

        // Get days in target month from Aladhan
        const daysInMonth = months[targetMonthIndex].length;

        const result = {
            HijriDay: 1,
            HijriMonthName: hijriMonth,
            HijriYear: hijriYear,
            DaysInMonth: daysInMonth,
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