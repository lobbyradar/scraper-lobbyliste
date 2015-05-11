# Scraper Lobbyliste

Scraper für die [Lobbyliste des Deutschen Bundestages](http://bundestag.de/dokumente/lobbyliste).
Die letzte Fassung wird heruntergeladen, nach JSON konvertiert und mit LZMA komprimiert.

## Installation

Stellen Sie sicher, dass [node.js](https://nodejs.org/) oder [io.js](https://nodejs.org/) installiert sind.

```
git clone https://github.com/lobbyradar/scraper-lobbyliste.git
cd scraper-lobbyliste
npm install
```

## Scraper ausführen

```
DEBUG=scraper node ./scraper.js <data-dir>
```

## Lizenz

[Diese Software wurde in die Gemeinfreiheit entlassen](http://unlicense.org/UNLICENSE).