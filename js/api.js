async function fetchHijriDateToday() {
    const proxyUrl = 'https://script.google.com/macros/s/AKfycbwl8HZHd6qsGiThq3HSBrhtHKTWjJn7ShbwbWC7Fo8CGiVN76p5Nersez9Vb3ve-_b5/exec';
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

        const hijriMonths = [
            'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
            'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
        ];
        const monthIndex = hijriMonths.indexOf(data.hijriMonth);
        const monthData = data.aladhanCalendar[monthIndex];
        const daysInMonth = monthData.length;

        const todayGregorian = new Date(data.gregorianDate);
        todayGregorian.setHours(0, 0, 0, 0);
        const gregorianStart = new Date(todayGregorian);
        gregorianStart.setDate(todayGregorian.getDate() - (data.hijriDay - 1));

        return {
            hijriDay: data.hijriDay,
            hijriMonthName: data.hijriMonth,
            hijriYear: data.hijriYear,
            daysInMonth: daysInMonth,
            gregorianStart: gregorianStart
        };
    } catch (error) {
        console.error('خطأ في جلب التاريخ:', error.message);
        throw error;
    }
}