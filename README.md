# 🔍 Android Log Analyzer

Real-time Android logcat parser with filtering, pattern matching, and automatic alerts.

## Features
- **Real-time streaming** — watch logs as they happen
- **Filtering** — by tag, log level
- **Pattern detection** — auto-detects ANR, crashes, OOM, timeouts, permissions, boot issues
- **Alerts** — visual warnings when issues detected
- **Export** — save filtered logs to file

## Usage

```bash
npm install
node index.js

# Filter by tag
node index.js --filter MyApp

# Show only warnings and errors
node index.js --level W

# Export to file
node index.js --export logs.txt

# Combine filters
node index.js --filter MyApp --level E --export errors.txt
```

## Example Output

```
16:42:30.123 [E] ActivityManager: ANR in com.example.app
⚠️ ALERT: ANR detected!

16:42:31.456 [E] AndroidRuntime: FATAL EXCEPTION: main
⚠️ ALERT: CRASH detected!
```

## Alert Patterns

- **ANR** — Application Not Responding
- **CRASH** — Fatal exceptions and uncaught exceptions
- **OOM** — Out of memory errors
- **TIMEOUT** — Timeout errors
- **PERMISSION** — Permission denied
- **BOOT** — Boot/startup issues
