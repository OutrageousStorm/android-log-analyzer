#!/usr/bin/env node
/**
 * android-log-analyzer.js
 * Real-time logcat parser with filtering, pattern matching, and alerts
 * Usage: node index.js [--filter TAG] [--level D|I|W|E] [--export file.txt]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const colors = require('colors');

const LEVELS = {
    'V': colors.gray,      // Verbose
    'D': colors.cyan,      // Debug
    'I': colors.white,     // Info
    'W': colors.yellow,    // Warning
    'E': colors.red,       // Error
    'F': colors.inverse,   // Fatal
};

const PATTERNS = {
    'ANR': /ANR in (\S+)/,
    'CRASH': /(FATAL EXCEPTION|AndroidRuntime)/,
    'OOM': /(OutOfMemoryError|MemoryError)/,
    'TIMEOUT': /timeout/i,
    'PERMISSION': /(Permission denied|permission error)/i,
    'BOOT': /boot|startup/i,
};

class LogAnalyzer {
    constructor(options) {
        this.filter = options.filter || '';
        this.level = options.level || 'D';
        this.exportFile = options.export || null;
        this.logs = [];
        this.alerts = [];
        this.stats = {};
    }

    parse(line) {
        // Format: MM-DD HH:MM:SS.mmm PID TID LEVEL TAG: Message
        const match = line.match(/(\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.+?):\s(.*)/);
        if (!match) return null;

        return {
            date: match[1],
            time: match[2],
            pid: match[3],
            tid: match[4],
            level: match[5],
            tag: match[6],
            message: match[7],
            fullLine: line,
        };
    }

    shouldShow(log) {
        if (this.filter && log.tag.indexOf(this.filter) === -1) return false;
        const levels = 'VDIWEF';
        if (levels.indexOf(log.level) < levels.indexOf(this.level)) return false;
        return true;
    }

    checkAlerts(log) {
        for (const [type, pattern] of Object.entries(PATTERNS)) {
            if (pattern.test(log.message)) {
                this.alerts.push({
                    type,
                    timestamp: `${log.date} ${log.time}`,
                    tag: log.tag,
                    message: log.message.substring(0, 100),
                });
                return type;
            }
        }
        return null;
    }

    displayLog(log) {
        const colorFunc = LEVELS[log.level] || colors.white;
        const levelStr = colorFunc(`[${log.level}]`);
        const tagStr = colors.bold(log.tag.substring(0, 20).padEnd(20));
        const msg = log.message.substring(0, 120);

        console.log(`${log.time} ${levelStr} ${tagStr} ${msg}`);
        this.logs.push(log);
    }

    run() {
        console.log(colors.cyan('🔍 Android Log Analyzer\n'));

        const logcat = spawn('adb', ['logcat', '-v', 'threadtime']);

        logcat.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                const log = this.parse(line);
                if (!log) return;

                const alert = this.checkAlerts(log);
                if (alert) {
                    console.log(colors.inverse(`⚠️ ALERT: ${alert} detected!`));
                }

                if (this.shouldShow(log)) {
                    this.displayLog(log);
                }
            });
        });

        logcat.stderr.on('data', (data) => {
            console.error(colors.red(`Error: ${data}`));
        });

        logcat.on('close', () => {
            this.printSummary();
        });
    }

    printSummary() {
        console.log(colors.cyan('\n\n=== Summary ==='));
        console.log(`Total logs: ${this.logs.length}`);
        console.log(`Alerts: ${this.alerts.length}`);
        if (this.alerts.length > 0) {
            console.log(colors.red('\nAlerts:'));
            this.alerts.forEach(a => {
                console.log(`  ${a.type}: ${a.message}`);
            });
        }
        if (this.exportFile) {
            this.export();
        }
    }

    export() {
        const content = this.logs.map(l => 
            `${l.time} [${l.level}] ${l.tag}: ${l.message}`
        ).join('\n');
        fs.writeFileSync(this.exportFile, content);
        console.log(colors.green(`✓ Exported to ${this.exportFile}`));
    }
}

// Parse args
const args = process.argv.slice(2);
const options = {
    filter: args[args.indexOf('--filter') + 1] || '',
    level: args[args.indexOf('--level') + 1] || 'D',
    export: args[args.indexOf('--export') + 1] || null,
};

const analyzer = new LogAnalyzer(options);
analyzer.run();
