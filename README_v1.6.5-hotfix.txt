V1.6.5 HOTFIX — audience feedback section

Reason for this hotfix:
The previous V1.6.4 update-only package accidentally omitted js/i18n.js and js/main.js.
If only that package was uploaded, the page would display raw keys such as:
  feedback.title
  feedback.line1
and the QR area would remain in the pending state.

Replace these files on GitHub Pages:
- index.html
- css/main.css
- js/i18n.js
- js/main.js
- js/feedback-config.js
- assets/qr/future-zh.svg
- assets/qr/future-en.svg
- assets/qr/future-ja.svg
- assets/qr/future-zh.png
- assets/qr/future-en.png
- assets/qr/future-ja.png

After upload, hard refresh once (Ctrl+F5).
The cache-buster has been updated to v=165.
