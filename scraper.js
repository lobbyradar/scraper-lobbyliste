#!/usr/bin/env node

// set base url
var BASEURL = "http://bundestag.de/dokumente/lobbyliste";

// node modules
var xz = require("xz");
var fs = require("fs");
var tmp = require("tmp");
var url = require("url");
var path = require("path");
var argv = require("minimist")(process.argv.slice(2));
var debug = require("debug")("scraper");
var crypto = require("crypto");
var moment = require("moment");
var mkdirp = require("mkdirp");
var pdftxt = require("pdftxt");
var request = require("request");
var scrapyard = require("scrapyard");

// local modules
var namejs = require(path.resolve(__dirname, "lib/name.js"));

// determine outdir
var outdir = (argv._[0]) ? path.resolve(argv._[0]) : path.resolve(__dirname, "data");
debug("outdir is %s", outdir);

// create outdir if not existing
if (!fs.existsSync(outdir)) if (!mkdirp.sync(outdir)) console.error("could not create outdir ", outdir) || process.exit();

// determine filename
var outfile = path.resolve(outdir, "lobbyliste."+moment().format("YYYYMMDD")+".json.xz");

// configure tmp
tmp.setGracefulCleanup();

var regex_url = new RegExp("^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$","i");

// extract address information
var extract_addr = function(addr, addrtype, fn){

	if (/^(–|\-)?$/.test(addr[0])) return fn(null, null);

	var entry = {};
	var remain = [];

	addr.forEach(function(line){
		if (/^(Tel\.|Fax): /.test(line)) {
			// phone and / or fax
			var _tel = line.match(/Tel\.: ([0-9 \(\)]+)(\s|$)/);
			if (_tel) entry.tel = _tel[1].replace(/[^0-9]/g,'').replace(/^00/,'+').replace(/^0/,'+49');
			var _fax = line.match(/Fax: ([0-9 \(\)]+)(\s|$)/);
			if (_fax) entry.fax = _fax[1].replace(/[^0-9]/g,'').replace(/^00/,'+').replace(/^0/,'+49');
		} else if (/^E-Mail: /.test(line)) {
			// email
			var _email = line
				.replace(/\.@/,'@')
				.replace(/\-de$/,'.de')
				.replace(/@bund@/,'.bund@')
				.replace(/verbandbildungsmedien/,'verband@bildungsmedien')
				.match(/^E-Mail: ((([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))($|;?\s+))/);
			if (_email) entry.email = _email[1];
		} else if (/^Internet: /.test(line)) {
			// www
			var _www = line
				.replace(/http\./,'http:')
				.replace(/http\//,'http:/')
				.replace(/http:\/\/\//,'http://')
				.replace(/http:\/([^\/])/,'http://$1')
				.replace(/(\.|:)$/,'')
				.replace(/\.-/,'-')
				.match(/^Internet: (.*)$/).pop();
			if (regex_url.test(_www)) entry.www = _www;
		} else {
			remain.push(line);
		}
	});
	
	if (/,\s+([A-Za-z]+)$/.test(remain[(remain.length-1)])) {
		remain = remain.concat(remain.pop().split(/,\s+/));
	};
	
	if (/^[0-9]{5}\s+/.test(remain[(remain.length-1)])) {
		// probably a postcode
		var _adr =  remain.pop().match(/^([0-9]{5})\s+(.*)$/);
		entry.country = "Deutschland";
		entry.postcode = _adr[1];
		entry.city = _adr[2];
	} else if (/^[0-9]{6,7}\s+/.test(remain[(remain.length-1)])) {
		// probably a wrong postcode
		var _adr =  remain.pop().match(/^([0-9]{6,7})\s+(.*)$/);
		entry.country = "Deutschland";
		entry.postcode = _adr[1];
		entry.city = _adr[2];
	} else if (/^(Niederlande|Belgien|Schweiz|Luxemburg|Dänemark|Österreich|Tschechien|Polen|USA|Israel|Russland)$/.test(remain[(remain.length-1)])) {
		// international address
		entry.country = remain.pop();
		var _adr = remain.pop().match(/^([A-Z]{1,2}\s?-\s?)?([0-9A-Z\ \-]+)\s+([A-Za-zäöüßÄÖÜ\u00C0-\u00ff\ \-]+)$/);
		if (!_adr) return fn(new Error("unable to parse address #1 "+addr.join("\n")));
		entry.postcode = _adr[2];
		entry.city = _adr[3];
	} else if (/^(Vereinigtes Königreich)$/.test(remain[(remain.length-1)])) {
		entry.country = remain.pop();
		var _adr = remain.pop().match(/^([A-Z0-9]{3}\s?[A-Z0-9]{3})$/i);
		if (!_adr) return fn(new Error("unable to parse address #3 "+addr.join("\n")));
		entry.postcode = _adr[1];
		entry.city = remain.pop();
	} else if (remain.length <= 2) {
		// name only, yay!
		entry.name = remain.join(" ");
		return fn(null, entry);
	} else {
		return fn(new Error("unable to parse address #2 "+addr.join("\n")));
	}
	
	entry.name = [];
	entry.addr = [];
	var type = "name";
	
	remain.forEach(function(line){
		if (type === "name" && (/(c\/o|^postfach\b|[Ss]tr(aße|\.)?\b|[Aa]llee\b|[Pp]latz\b|[Gg]asse\b|[Ww]eg\b|\b([0-9]+\-)?[0-9]+\s?[a-zA-Z]*$|[Vv]orstand|[Ss]ekretär|[Gg]eschäfts)/.test(line))) type = "addr";
		// if line contains e.V., it's name, even if it should be address
		if (/e\.\s?\V\./.test(line)) {
			entry["name"].push(line);
		} else {
			entry[type].push(line);
		}
		// if line contains e.V. or abbrevation, next line is address
		if (type === "name" && /(e\.\s?\V\.|\([A-Z]+\)$)/.test(line)) type = "addr";
	});
	
	entry.name = entry.name.join(" ");
	entry.addr = entry.addr.join(", ");
	
	switch (addrtype) {
		case "main":
			entry.type = "main";
		break;
		case "extra":
			if (entry.name === "") delete entry.name;
			entry.type = "extra";
		break;
	}
		
	return fn(null, entry);;
		
};

// extract and unify names
var extract_people = function(lines, type, fn){
	fn(null, namejs(lines).map(function(person){
		person.type=type;
		return person;
	}));
};

// convert raw date to structured data
var convert = function(data, fn){
	var sets = [];
	data.forEach(function(entry){
		var set = {
			name: null,
			addr: [],
			members: null,
			orgs: null,
			description: null,
			people: [],
			source_url: entry.source_url
		};
		extract_addr(entry.addr, "main", function(err, addr){
			if (err) debug("address extraction error %s", err);
			if (!err && addr) set.addr.push(addr);
			set.name = addr.name;
			extract_addr(entry.weitere_addr, "extra", function(err, addr){
				if (err) debug("address extraction error %s", err);
				if (!err && addr) set.addr.push(addr);
				set.members = (parseInt(entry.mitgliederzahl[0],10)||null);
				set.orgs = (parseInt(entry.angeschlossene_orga[0],10)||null);
				set.description = entry.interessenbereich.join(" \n");
				extract_people(entry.vorstand, "vorstand", function(err, people){
					if (err) debug("address extraction error %s", err);
					if (!err && people && (people instanceof Array)) people.forEach(function(person){
						set.people.push(person);
					});
					extract_people(entry.verbandsvertreterinnen, "verband", function(err, people){
						if (err) debug("address extraction error %s", err);
						if (!err && people && (people instanceof Array)) people.forEach(function(person){
							set.people.push(person);
						});
						if (entry.addr_bt.length < 20 && entry.addr_bt[0] !== "–" && (!/\(s\. Abschnitt/.test(entry.addr_bt[0]))) {
							extract_addr(entry.addr_bt, "extra", function(err, addr){
								if (err) debug("address extraction error %s", err);
								if (!err && addr) set.addr.push(addr);
								sets.push(set);
								if (sets.length === data.length) fn(null, sets);
							});
						} else {
							sets.push(set);
							if (sets.length === data.length) fn(null, sets);
						}
					});
				});
			});
		});
	});
};

(function(fn){
	// create tmp dir
	tmp.dir(function(err, tmpdir) {
		if (err) return fn(err);
		// new scraper
		var scraper = new scrapyard({
			debug: false,
			retries: 5,
			connections: 10,
			cache: tmpdir,
			bestbefore: "5min"
		});
		// scrape pdf
		scraper.scrape({ url: BASEURL, type: "html" }, function(err, $){
			if (err) return fn(err);
			if ($('.linkliste .linkGeneric a[title^=Aktuelle]').length !== 1) return fn(new Error("Unable to locate PDF link"));
			var PDFURL = url.resolve(BASEURL, $('.linkliste .linkGeneric a[title^=Aktuelle]').attr("href"));
			debug("pdf url is %s", PDFURL);
			request.get(PDFURL).on("response", function(resp){
				if (resp.statusCode !== 200) return fn(new Error("Status code is "+response.statusCode));
				if (!/^application\/pdf/.test(resp.headers['content-type'])) return fn(new Error("Content type is "+resp.headers['content-type']));
				var TMPFILE = path.resolve(tmpdir, crypto.pseudoRandomBytes(8).toString('hex')+".pdf");
				debug("saving to %s", TMPFILE);
				this.pipe(fs.createWriteStream(TMPFILE)).on("finish", function(){
					debug("download complete");
					// extract pdf text
					pdftxt(TMPFILE, function(err, data) {
						if (err) return fn(err);
						debug("pdf parsing complete");
						fs.unlink(TMPFILE);
						
						// convert entries
						(function(data, ffn){
							var lines = [];
							var entries = [];
							data.forEach(function(page){
								// ignore paages 1-3
								if (page.num <= 3) return;
								page.blocks.forEach(function(block){
									// ignore header and footer
									if (block.bbox[1] < 60 || block.bbox[1] > 1200) return;
									block.lines.forEach(function(line){
										if (/^Name\s+und\s+Sitz,\s+1\.\s+Adresse/.test(line)){
											lines.pop();
											if (lines.length >= 3) entries.push(lines);
											lines = [];
										} else {
											lines.push(line);
										}
									});
								});
							});
							entries.push(lines);
							ffn(entries);
						})(data, function(data){
							// convert entries to objects
							var entries = [];
							data.forEach(function(blob){
								var entry = {};
								var type = "addr";
								// iterate over data blobs
								blob.forEach(function(item){
									if (!entry.hasOwnProperty(type)) entry[type] = [];
									switch (item) {
										case "Weitere Adresse": type = "weitere_addr"; break;
										case "Vorstand und Geschäftsführung": type = "vorstand"; break;
										case "Interessenbereich": type = "interessenbereich"; break;
										case "Mitgliederzahl": type = "mitgliederzahl"; break;
										case "Anzahl der angeschlossenen Organisationen": type = "angeschlossene_orga"; break;
										case "Verbandsvertreter/-innen": type = "verbandsvertreterinnen"; break;
										case "Anschrift am Sitz von BT und BRg": type = "addr_bt"; break;
										default:
											entry[type].push(item);
										break;
									}
								});
								entry.source_url = PDFURL;
								entries.push(entry);
							});
							return fn(null, entries);
						});
					});
				});
			});
		});
	});
})(function(err, data){
	if (err) return console.log(err) || process.exit(-1);
	debug("starting conversion");
	convert(data, function(err, sets){
		debug("conversion finished");
		var compressor = new xz.Compressor(9);
		compressor.pipe(fs.createWriteStream(outfile).on("finish", function(){
			debug("file saved to %s", path.basename(outfile));
		}));
		compressor.write(JSON.stringify(sets,null,'\t'));
		compressor.end();
	});
});
