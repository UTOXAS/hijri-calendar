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
    const firstDayWeekday = (gregorianStart.getDay() + 1) % 7; // Saturday = 0

    let dayCounter = 1;
    const weeks = Math.ceil((daysInMonth + firstDayWeekday) / 7);
    const calendarData = [];

    for (let i = 0; i < weeks; i++) {
        const row = document.createElement('tr');
        const rowData = [];
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            const position = i * 7 + j;
            if (position >= firstDayWeekday && dayCounter <= daysInMonth) {
                const gregDay = new Date(gregorianStart);
                gregDay.setDate(gregorianStart.getDate() + (dayCounter - 1));
                const gregText = gregDay.getDate() + (gregDay.getMonth() !== gregorianStart.getMonth() ? ` ${gregDay.toLocaleString('ar', { month: 'long' })}` : '');
                cell.textContent = `${dayCounter} (${gregText})`;
                cell.title = `${formatHijriDate(dayCounter, hijriMonth, hijriYear)} - ${formatGregorianDate(gregDay.getDate(), gregDay.toLocaleString('ar', { month: 'long' }), gregorianYear)}`;

                const today = new Date();
                if (gregDay.toDateString() === today.toDateString()) {
                    cell.classList.add('current-day');
                }
                rowData.push(cell.textContent);
                dayCounter++;
            } else {
                rowData.push('');
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
        calendarData.push(rowData);
    }

    return calendarData;
}

// Navigate to previous month
function prevMonth(currentDate) {
    currentDate.setMonth(currentDate.getMonth() - 1);
    return new Date(currentDate);
}

// Navigate to next month
function nextMonth(currentDate) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    return new Date(currentDate);
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

// Generate formatted text matching the expected format
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