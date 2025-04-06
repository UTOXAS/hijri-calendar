// Generate calendar for a given month and year
function generateCalendar(hijriData, gregorianDate) {
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';

    const hijriMonth = hijriData.HijriMonthName;
    const hijriYear = hijriData.HijriYear;
    const gregorianStart = new Date(hijriData.GregorianStart);
    const gregorianEnd = new Date(gregorianStart);
    gregorianEnd.setDate(gregorianStart.getDate() + hijriData.DaysInMonth - 1);

    const gregorianStartMonth = gregorianStart.toLocaleString('ar', { month: 'long' });
    const gregorianEndMonth = gregorianEnd.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianStart.getFullYear();
    const gregorianHeader = gregorianStartMonth === gregorianEndMonth
        ? `${gregorianStartMonth} ${gregorianYear} م`
        : `${gregorianStartMonth} - ${gregorianEndMonth} ${gregorianYear} م`;

    document.getElementById('month-year').textContent = `${hijriMonth} ${hijriYear} هـ - ${gregorianHeader}`;

    const daysInMonth = hijriData.DaysInMonth;
    const firstDayWeekday = gregorianStart.getDay(); // 0 = Sunday, 6 = Saturday

    let dayCounter = 1;
    const weeks = Math.ceil((daysInMonth + firstDayWeekday) / 7);
    const calendarData = [];

    for (let i = 0; i < weeks; i++) {
        const row = document.createElement('tr');
        const rowData = new Array(7).fill('');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            const position = i * 7 + j;
            if (position >= firstDayWeekday && dayCounter <= daysInMonth) {
                const gregDay = new Date(gregorianStart);
                gregDay.setDate(gregorianStart.getDate() + (dayCounter - 1));
                const gregMonth = gregDay.toLocaleString('ar', { month: 'long' });
                const isFirstOfGregMonth = gregDay.getDate() === 1;
                const isLastOfGregMonth = gregDay.getDate() === new Date(gregDay.getFullYear(), gregDay.getMonth() + 1, 0).getDate();
                const gregText = `${gregDay.getDate()}${(isFirstOfGregMonth || isLastOfGregMonth) ? ` ${gregMonth}` : ''}`;
                cell.textContent = `${dayCounter} (${gregText})`;
                cell.title = `${formatHijriDate(dayCounter, hijriMonth, hijriYear)} - ${formatGregorianDate(gregDay.getDate(), gregMonth, gregorianYear)}`;

                const today = new Date();
                if (gregDay.toDateString() === today.toDateString()) {
                    cell.classList.add('current-day');
                }
                rowData[j] = cell.textContent;
                dayCounter++;
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
        calendarData.push(rowData);
    }

    return calendarData;
}

// Navigate to previous Hijri month
function prevMonth(hijriMonth, hijriYear) {
    const hijriMonths = [
        'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
        'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
    ];
    let monthIndex = hijriMonths.indexOf(hijriMonth);
    let year = parseInt(hijriYear);
    monthIndex--;
    if (monthIndex < 0) {
        monthIndex = 11;
        year--;
    }
    return { month: hijriMonths[monthIndex], year: year.toString() };
}

// Navigate to next Hijri month
function nextMonth(hijriMonth, hijriYear) {
    const hijriMonths = [
        'مُحَرَّم', 'صَفَر', 'رَبيع الأوَّل', 'رَبيع الثاني', 'جُمادى الأولى', 'جُمادى الآخرة',
        'رَجَب', 'شَعْبان', 'رَمَضان', 'شَوّال', 'ذو القَعدة', 'ذو الحِجَّة'
    ];
    let monthIndex = hijriMonths.indexOf(hijriMonth);
    let year = parseInt(hijriYear);
    monthIndex++;
    if (monthIndex > 11) {
        monthIndex = 0;
        year++;
    }
    return { month: hijriMonths[monthIndex], year: year.toString() };
}

// Generate CSV format
function generateCSV(calendarData, hijriData, gregorianDate) {
    const headers = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    calendarData.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    return csv;
}

// Generate formatted text matching the required format
function generateFormattedText(calendarData, hijriData, gregorianDate) {
    const headers = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const hijriMonth = hijriData.HijriMonthName;
    const hijriYear = hijriData.HijriYear;
    const gregorianStart = new Date(hijriData.GregorianStart);
    const gregorianEnd = new Date(gregorianStart);
    gregorianEnd.setDate(gregorianStart.getDate() + hijriData.DaysInMonth - 1);
    const gregorianStartMonth = gregorianStart.toLocaleString('ar', { month: 'long' });
    const gregorianEndMonth = gregorianEnd.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianStart.getFullYear();
    const gregorianHeader = gregorianStartMonth === gregorianEndMonth
        ? `${gregorianStartMonth} ${gregorianYear} م`
        : `${gregorianStartMonth} - ${gregorianEndMonth} ${gregorianYear} م`;

    let text = `${hijriMonth} ${hijriYear} هـ\n${gregorianHeader}\n\n`;
    text += headers.join('     | ') + '\n';
    text += headers.map(() => '----------').join('|') + '\n';
    calendarData.forEach(row => {
        text += row.map(cell => cell.padEnd(11)).join('| ') + '\n';
    });
    return text.trim();
}