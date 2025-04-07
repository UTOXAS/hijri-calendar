async function fetchHijriDateToday() {
    const proxyUrl = "https://script.google.com/macros/s/AKfycbxEDMoKOUxcBZI4luQ1LLerAMo3B1Vei5t29IyToN5uHKhwMfGKFmqJgDklPVyU5vc/exec"; // Replace with new URL after deployment
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`فشل في جلب البيانات: ${response.status}`);
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

        const hijriMonthName = monthNameMap[data.hijriMonth] || data.hijriMonth;
        const gregorianStart = new Date(data.gregorianStart);
        gregorianStart.setHours(0, 0, 0, 0);

        return {
            hijriDay: data.hijriDay,
            hijriMonthName: hijriMonthName,
            hijriYear: data.hijriYear,
            daysInMonth: data.daysInMonth,
            gregorianStart: gregorianStart
        };
    } catch (error) {
        console.error('خطأ في جلب التاريخ:', error.message);
        throw error;
    }
}