// Fetch Hijri date from Dar Ifta API
async function fetchHijriDate() {
    const cacheKey = 'hijriDate';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    const url = 'http://di107.dar-alifta.org/api/HijriDate?langID=1';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب البيانات');
        const data = await response.json();
        cacheData(cacheKey, data);
        return data;
    } catch (error) {
        console.error('خطأ في جلب التاريخ الهجري:', error);
        throw error;
    }
}