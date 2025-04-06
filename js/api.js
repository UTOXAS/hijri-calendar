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

// Fetch Hijri month data, adjusted to Dar Ifta’s start date
async function fetchHijriDate(gregorianDate) {
    const cacheKey = `hijriDate_${gregorianDate.toISOString().split('T')[0]}`;
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
        const hijriMonthName = darIftaData.hijriMonthName;
        const hijriYear = darIftaData.hijriYear;

        // Assume 30 days for simplicity; adjust if Dar Ifta provides this
        const daysInMonth = 30; // Could fetch from Aladhan if needed

        // Calculate Gregorian start of the Hijri month
        const gregorianStart = new Date(gregorianDate);
        gregorianStart.setDate(gregorianStart.getDate() - (todayHijriDay - 1));
        if (isNaN(gregorianStart.getTime())) {
            throw new Error('فشل في حساب بداية الشهر الهجري');
        }

        // Adjust to match Dar Ifta’s start (March 31, 2025, for Shawwal 1)
        const today = new Date();
        const daysSinceStart = todayHijriDay - 1;
        gregorianStart.setTime(today.getTime() - daysSinceStart * 24 * 60 * 60 * 1000);

        const result = {
            HijriDay: 1,
            HijriMonthName: hijriMonthName,
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