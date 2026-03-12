const fs = require('fs');
let code = fs.readFileSync('functions/calendarSession.ts', 'utf8');

const search = /\.map\(\(event: any\) => \(\{\r?\n\s+start: event\.start\?\.dateTime \|\| event\.start\?\.date,\r?\n\s+end: event\.end\?\.dateTime \|\| event\.end\?\.date\r?\n\s+\}\)\)/m;

const replace = '.map((event: any) => ({\n' +
'                        summary: event.summary,\n' +
'                        start: event.start?.dateTime || event.start?.date,\n' +
'                        end: event.end?.dateTime || event.end?.date\n' +
'                    }))';

code = code.replace(search, replace);

fs.writeFileSync('functions/calendarSession.ts', code);
