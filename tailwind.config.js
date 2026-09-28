// Tailwind durchsucht diese Dateien nach verwendeten Klassen und nimmt nur diese in tailwind.min.css auf.
// Nach jeder Änderung an Klassen in den HTML-Dateien neu erzeugen: npm run build:css
module.exports = {
    content: ['./*.html', './labor.js'],
    theme: { extend: {} },
    plugins: [],
};
