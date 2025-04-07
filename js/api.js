async function fetchHijriDateToday() {
    const proxyUrl = "https://script.google.com/macros/s/AKfycbw5YJGaV-gmeHT5w5Gow948OTEKIiFjCcMOZt2xAZhgAveSZU9VTvbNj8Qduj-5VfwO/exec";
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`فشل في جلب البيانات: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const monthNameMap = {
            'Muharram': 'مُحَرَّم',
            'Safar': 'صَفَر',
            'RabiealAwwal': 'رَبيع الأوَّل',
            'RabiealThani': 'رَبيع الثاني',
            'JumadaalAwwal': 'جُمادى الأولى',
            'JumadaalThani': 'جُمادى الآخرة',
            'Rajab': 'رَجَب',
            'Saban': 'شَعْبان',
            'Ramadan': 'رَمَضان',
            'Shawwal': 'شَوّال',
            'DhulQida': 'ذو القَعدة',
            'DhulHijja': 'ذو الحِجَّة'
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