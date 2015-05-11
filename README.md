# Scraper Lobbyliste

Scraper for [http://bundestag.de/dokumente/lobbyliste](http://bundestag.de/dokumente/lobbyliste).
The latest document will be downloaded, converted to JSON and compressed with LZMA.

## Install

Make sure you have [node.js](https://nodejs.org/) or [io.js](https://nodejs.org/) and [nmp](https://www.npmjs.com/) installed.

```
git clone https://github.com/lobbyradar/scraper-lobbyliste.git
cd scraper-lobbyliste
npm install
```

## Run Scraper

```
DEBUG=scraper node ./scraper.js <data-dir>
```

## License

[This software is released into the public domain](http://unlicense.org/UNLICENSE).