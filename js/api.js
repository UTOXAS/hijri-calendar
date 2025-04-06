// Fetch Hijri date from Aladhan API, adjusted to month start
async function fetchHijriDate(gregorianDate) {
    const cacheKey = `hijriDate_${gregorianDate.toISOString().split('T')[0]}`;
    let cachedData = getCachedData(cacheKey);
    if (cachedData) {
        if (cachedData.GregorianStart) {
            cachedData.GregorianStart = new Date(cachedData.GregorianStart);
            if (isNaN(cachedData.GregorianStart.getTime())) {
                console.warn('Cached GregorianStart is invalid, refetching:', cachedData);
            } else {
                return cachedData;
            }
        }
    }

    const day = gregorianDate.getDate();
    const month = gregorianDate.getMonth() + 1; // Months are 0-indexed
    const year = gregorianDate.getFullYear();
    const url = `http://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`;

    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`فشل في جلب البيانات من واجهة البرمجة: ${response.status}`);

        const data = await response.json();
        console.log('API Response:', data); // Debug log

        if (data.code !== 200 || !data.data || !data.data.hijri) {
            throw new Error('استجابة غير صالحة من الخادم: ' + JSON.stringify(data));
        }

        const hijriData = data.data.hijri;

        // Validate and extract required fields with fallbacks
        const hijriDay = parseInt(hijriData.day, 10) || 1;
        const daysInMonth = parseInt(hijriData.month?.length, 10) || 30;
        const hijriMonthName = hijriData.month?.ar || 'غير محدد';
        const hijriYear = hijriData.year || 'غير محدد';

        // Calculate the start of the Hijri month
        const gregorianStart = new Date(gregorianDate);
        if (isNaN(gregorianStart.getTime())) {
            throw new Error('تاريخ ميلادي غير صالح: ' + gregorianDate);
        }
        gregorianStart.setDate(gregorianStart.getDate() - (hijriDay - 1));
        if (isNaN(gregorianStart.getTime())) {
            throw new Error('فشل في حساب بداية الشهر الهجري');
        }

        const result = {
            HijriDay: 1, // Start of the month
            HijriMonthName: hijriMonthName,
            HijriYear: hijriYear,
            DaysInMonth: daysInMonth,
            GregorianStart: gregorianStart.toISOString() // Store as string for caching
        };

        cacheData(cacheKey, result);
        return {
            ...result,
            GregorianStart: new Date(result.GregorianStart) // Return as Date object
        };
    } catch (error) {
        console.error('خطأ في جلب التاريخ الهجري:', error.message);
        throw error;
    }
}