const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientBooking.jsx', 'utf8');

const r1Search = /useEffect\(\(\) => \{\s+const fetchBusyTimes = async \(\) => \{\s+if \(\!selectedDate\) return;\s+setLoadingBusyTimes\(true\);\s+try \{\s+\/\/ Get busy times for the entire day[\s\S]*?fetchBusyTimes\(\);\s+\}, \[selectedDate\]\);/m;

const r1Replace = '  useEffect(() => {\n' +
'    const fetchBusyTimes = async () => {\n' +
'      const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);\n' +
'      const end = addDays(start, 6);\n' +
'      setLoadingBusyTimes(true);\n' +
'      try {\n' +
'        const weekStart = new Date(start);\n' +
'        weekStart.setHours(0, 0, 0, 0);\n' +
'        const weekEnd = new Date(end);\n' +
'        weekEnd.setHours(23, 59, 59, 999);\n' +
'        const response = await base44.functions.invoke(\'calendarSession\', {\n' +
'          action: \'checkAvailability\',\n' +
'          timeMin: weekStart.toISOString(),\n' +
'          timeMax: weekEnd.toISOString(),\n' +
'        });\n' +
'        const data = response?.data || response;\n' +
'        if (data?.error) {\n' +
'          console.error(\'FreeBusy API returned error:\', data.error);\n' +
'          setCalendarError(data.error);\n' +
'          setCalendarBusyTimes([]);\n' +
'        } else if (data?.success && data?.busyTimes) {\n' +
'          setCalendarBusyTimes(data.busyTimes);\n' +
'          setCalendarError(null);\n' +
'        } else {\n' +
'          setCalendarBusyTimes([]);\n' +
'          setCalendarError(null);\n' +
'        }\n' +
'      } catch (error) {\n' +
'        console.error(\'Failed to fetch calendar busy times:\', error);\n' +
'        setCalendarError(\'Kon Google Calendar niet bereiken\');\n' +
'        setCalendarBusyTimes([]);\n' +
'      } finally {\n' +
'        setLoadingBusyTimes(false);\n' +
'      }\n' +
'    };\n' +
'    fetchBusyTimes();\n' +
'  }, [weekOffset]);';

code = code.replace(r1Search, r1Replace);

const r2Search = /const isAvailable = isDayAvailable\(day\);\s+const isDisabled = isPast \|\| \!isAvailable;\s+return \(/m;

const r2Replace = 'const isAvailable = isDayAvailable(day);\n' +
'                const hasSlots = isAvailable && !isPast ? getTimeSlots(day).length > 0 : false;\n' +
'                const isDisabled = isPast || !isAvailable || (!isPast && isAvailable && !hasSlots);\n' +
'                return (';

code = code.replace(r2Search, r2Replace);

fs.writeFileSync('src/pages/ClientBooking.jsx', code);
