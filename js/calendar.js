function generateCalendar(hijriData) {
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';

    const hijriMonth = hijriData.hijriMonthName;
    const hijriYear = hijriData.hijriYear;
    const gregorianStart = new Date(hijriData.gregorianStart);
    const gregorianEnd = new Date(gregorianStart);
    gregorianEnd.setDate(gregorianStart.getDate() + hijriData.daysInMonth - 1);

    const gregorianStartMonth = gregorianStart.toLocaleString('ar', { month: 'long' });
    const gregorianEndMonth = gregorianEnd.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianStart.getFullYear();
    const gregorianHeader = gregorianStartMonth === gregorianEndMonth
        ? `${gregorianStartMonth} ${gregorianYear} م`
        : `${gregorianStartMonth} - ${gregorianEndMonth} ${gregorianYear} م`;

    document.getElementById('month-year').textContent = `${hijriMonth} ${hijriYear} هـ - ${gregorianHeader}`;

    const daysInMonth = hijriData.daysInMonth;
    const firstDayWeekday = gregorianStart.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

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

function generateCSV(calendarData) {
    const headers = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    calendarData.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    return csv;
}

function generateFormattedText(calendarData, hijriData) {
    const headers = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const hijriMonth = hijriData.hijriMonthName;
    const hijriYear = hijriData.hijriYear;
    const gregorianStart = new Date(hijriData.gregorianStart);
    const gregorianEnd = new Date(gregorianStart);
    gregorianEnd.setDate(gregorianStart.getDate() + hijriData.daysInMonth - 1);
    const gregorianStartMonth = gregorianStart.toLocaleString('ar', { month: 'long' });
    const gregorianEndMonth = gregorianEnd.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianStart.getFullYear();
    const gregorianHeader = gregorianStartMonth === gregorianEndMonth
        ? `${gregorianStartMonth} ${gregorianYear} م`
        : `${gregorianStartMonth} - ${gregorianEndMonth} ${gregorianYear} م`;

    let text = `${hijriMonth} ${hijriYear} هـ\n${gregorianHeader}\n\n`;
    const columnWidth = 13;
    text += headers.map(h => h.padStart(columnWidth)).join('|') + '\n';
    text += headers.map(() => '-'.repeat(columnWidth)).join('|') + '\n';
    calendarData.forEach(row => {
        text += row.map(cell => cell.padEnd(columnWidth)).join('|') + '\n';
    });
    return text.trim();
}