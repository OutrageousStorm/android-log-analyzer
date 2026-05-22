const { spawn } = require('child_process');
const EventEmitter = require('events');

class LogcatMonitor extends EventEmitter {
    constructor(device = null) {
        super();
        this.device = device;
        this.process = null;
        this.filters = [];
    }
    
    start() {
        const cmd = this.device ? 'adb' : 'adb';
        const args = this.device ? ['-s', this.device, 'logcat', '-v', 'threadtime'] 
                                   : ['logcat', '-v', 'threadtime'];
        
        this.process = spawn(cmd, args);
        
        this.process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line && this.matchesFilters(line)) {
                    this.emit('log', line);
                }
            });
        });
    }
    
    matchesFilters(line) {
        if (this.filters.length === 0) return true;
        return this.filters.some(f => line.includes(f));
    }
    
    addFilter(tag) {
        this.filters.push(tag);
    }
    
    stop() {
        if (this.process) {
            this.process.kill();
        }
    }
}

module.exports = LogcatMonitor;
