# Hibuter

A field journal for comparing what you expected with what you actually noticed. Unlike a reminder that tells you what you were thinking, Hibuter asks you to write down what happened **before** it reveals your original prediction.

1. Pick something to watch: a plant, a daily habit, or a change in your neighborhood.
2. Write a prediction and choose a check-in date. The archive hides the prediction until then.
3. On or after that date, record your observation to read the two accounts together.

## Run locally

From this directory, run `python3 -m http.server 8000` and open `http://localhost:8000`. No installation, build step, account, or API key is needed. The app can also be served by any HTTPS static host.

Run the state-transition tests with `node --test` (Node.js 18+).

## Data and privacy

Dispatches are stored in your browser's local storage. They don't sync across devices, and clearing site data erases them. The seal is a journaling constraint, not encryption: someone with access to your browser storage can read the predictions. Check-in dates use your device's local calendar. There are no background notifications.
