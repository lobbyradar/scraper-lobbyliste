#!/usr/bin/env node

var regexes = [
	// prefixing academic degrees
	new RegExp("^(d?dr|mag|m\\.eng|prod|prof|rer|pol|med|(wirtsch\\.\\-|bau\\-)?ing|hdl|dipl?|sc|[ji]ur|soc|oec|theol|pharm|mult|nat|habil|agr|phil|univ|dent|stud|vet|hc|tr|hum|math|em|techn|troph|lic|arg|ö\\.b\\.v|h\\.c|e\\.h|[MB]\\.Sc)(\\([A-Z]+\\))?\\.[\\.\\s\\-]*","i"),
	// stuff in brackets
	new RegExp("^\\((BA|FA|FH7VWA|US|univ|Uni\\. Peking|TH|staatl\\.gepr\\.|RUS|I)\\)","i"),
	// job titles
	new RegExp("^(und )?((Mathemateker|(Bundes)?Vorstand|Assistent|Augenoptikermeister|Mediziner|agrar|Gesundheitsökonom|Straßenbaumeister|Bruder|Pater|Theologe|Jurist|(Medizin)?pädagog|Verwaltungs-Wirt|Veterinär|Kauf|Generalleutnant|General|Generalarzt|Fregattenkapitän|Agrarbiolog|Amtsanw[aä]lt|Apotheker|(Freie )?Architekt|(Berg-)?Assessor|Betriebswirt|Bischof( von [a-z]+)?|Botschafter|(vereidigter )?Buchprüfer|Bundesbankoberamtsrat|Bundesinnungsmeister|Bundesminister|Bundespräsident|Bundestagspräsident|Bürgermeister|Chefapotheker|Diakon|Dompropst|Augenoptiker|Optometrist|Biolog|Brennmeister|Chemiker|((Kommunikations|Grafik)[\-\s]?)?Designer|Finanzwirt|Forstwirt|Geograph|Geolog|Geophysiker|Handelslehrer|Holzwirt|Informatiker|Jurist|Kauf|Mathematiker|Medizinpädagog|Meteorolog|physiker|Politolog|Psycholog|Pädagog|Rechtspfleger|Restaurator|Sachverständig|Sozialpädagog|Sozialwirt|Sozialwissenschaftler|Soziolog|Stomatolog|Verwaltungsbetriebswirt|Verwaltungswirt|Verwaltungswissenschaftler|Volkswirt|Wirtschafts(ing)?|Wirtschaftsjurist|Ökonom|Übersetzer|Domkapitular|Probst|Finanzfachwirt|(Forst|Bau)assessor|Hauptfeldwebel|Hauptmann|Honorar|Honorargeneralkonsul|Honorarkonsul|Justizminister|Kapitän(leutnant)?|Konsul|Land(es)?rat|Landwirtschaftsmeister|Lohnsteuerberater|Landwirtschaftsdirektor|Luftverkehrskauf|Magistratsr[aä]t|Major|Minist|Ministerialdirektor|Ministerialdirigent|Monsignore|Notar|Oberamtsanw[aä]lt|Oberbürgermeister|Oberfeldarzt|Obermeister|Oberst|Oberstaatsanw[aä]lt|Oberstabsboots|Oberstabsfeldwebel|Oberstleutnant|Oberstudiendirektor|Staatssekretär|Parlamentarischer|Parlamentspräsident|Patentanw[aä]lt|Pfarrer|Politikwissenschaftler|Priv(\\.|at)-?Dozent|RA|Ran|Fachanwalt( für [a-z]+)?|Realschulrektor|Rechtsreferent|Regierungsamts(rat)?|Regionspräsident|Revieroberjäger|Richter(in)?( am [a-z]+)?|Senator|Staats(minister|sekretär)|Stabsfeldwebel|Stabshauptmann|(Steuer|Wirtschafts)(berater|prüfer)|Stuckateurmeister|Studiendirektor|Studienrat|Uni(v(ersitäts)?)?|Verleger|Rechtsjournalist|Rechtsjurist|Veterinärdirektor|Vizepräsident des Verwaltungsgerichts|Zahntechnikermeister|[AÄ]rzt)(er|e|\s?in|mann|frau)?)( a\\.D\\.)?([\\.\\-,\\s\\/]+|$)","i"),
	// suffixes
	new RegExp("\s+(OFM|M\\.A\\.|A\\.\s*D\\.)$","i"),
	// legacy regex
	new RegExp("^(Studien|Finanzwirtschaft|IfMTimisoara|und Notar|Staatsob\\.|RA in|SteuerberaterDr|und Dipl\\.-Betriebswirt|Recht II|CIA|CISA|CISM|CGEIT|LB|i\\.e\\.R\\.|u\\. Dipl|des Bergfachs|Master of Business Administration)[\\.\\-,\\s\\/]*"), // special cases
	new RegExp(",?\\s*(MSA|OFM|MSc|MHA|M\\.A\\.|MPH|MdB|Ausschuss (.*)|[gG]eschäftsf.*|Präsident|Vorsitzender|SDB|Direktor.*|Wissenschaftlicher.*|MdEP|Honorargeneralkonsul|Schriftführerin|[0-9]+\\. Vorsitzender|Qualitätssicherung|Vorstand(.*)|Steuerberater\\/vereidigter)\s*$","i"), // appendixes
	new RegExp("^(Psych|Dr|Prof|Dip(l(om)?)?|Ing|Inf|Hdl|PhD|Wirtsch(aft)?|Jur|M\\.Sc|sc|hum|arg|publ|stud|rer|agr|ret|nat|oec|pol|phil|soc|h\\.?\\s?c|med|vet|medic|uni(v)?|dent|habil|e\\.?\\s?h|m\\.?\\s?a|MSA|ass?|CCM|B\\.ec|Bau|Bundes|Agraring|Bauing|hdl|inf|wirtsch|met|päd|soz|stat|theol|verw|wirts|hd|sdb|mdb|Ltd|MPhil|MLM|Mr|Msgr|OTL|PD|Parl|DI MAAS|Magister|mult|iur|math|pharm|MdEP|Sir|ZA|vBP|StB|lic)[\\.\\-,\\s\\/]+","i"),
	new RegExp("\\((VWA|BA|FH|FA|TA|US|I|RUS|TH|Hf TCM Nanning|USA|staatl(ich|\\.)\\s?gepr(üft|\\.))\\)[\\.\\-,\\s\\/]*","i"),
	new RegExp("^(a\\.?\\s?D|d\\.?\\s?R|i\\.?\\s?G|i\\.?\\s?K)[\\.\\-,\\s\\/]+","i"),
	// some remaining fragments
	new RegExp("^(Ingenieur|Dolmetscherin|Amtfrau|Amtsrätin|BMVg|Bankkauffrau|Bauingin\\.|Bezirksnotar|BrigGen|CIPP\\/IT\\+E|CRISC|Dozent Dipl\\.\\-Wirtschaftler et Dipl\\.\\-Ing\\.|Dres\\.h\\.c\\.|El\\.\\-Ing\\. ETH|Erbrecht/Fachanwalt|FD|Fachanwältin für Arbeitsrecht|Fachplaner Ausbau Stukkateur\\- u\\.|Finanzierungs\\- und Leasingwirt|Fliesenlegermeister|Generalkonsul|Generalmajor|Generalstabsarzt|Geograf|Geografin|Geol\\.|Gerüstbaumeister|Grafik Designerin|Steuerberater/vereidigter|Heilpraktikerin|ISO 27001LA|IT\\-Betriebswirt|Juris|Justitiar|Kommunikationswirt|LD|LL M|Logistiker|Magistrat|Mdgt\\.|Ministerialrat|Notarassessor|Oberkirchenrat|Oberkirchenrätin|Oberstudienrat|Pastor|Pharmazeut|Primarius|Prod\\.|Prälat|RADr\\.|RBM|\\(DU\\)|Rechtsbeistand|Steuerberater/Wirtschaftsprüfer|Rechtsbeistand|Regierungspräsident|M\\. A\\.|Schneidwerkzeugmechanikermeister|Sozialarbeiter|Sozialarbeiterin|Sr\\. M\\.|StD|Staatl\\. geprüfter Augenoptiker|Tierarzt|Trockenbaumeister|Universitätsprof\\.|Veterinärmediziner|Visuelle Kommunikation|Volljuristin|Vorsitzender Richter am OLG|Vorsitzender Richter am Oberverwaltungsgericht|Vorsitzender Richter am Verwaltungsgericht|Vorsitzender Richter am Verwaltungsgerichts|Wildmeister|Wirtschaftsingenieurin|Zahnärztin|d\\.Res\\.|in|rätin|Bundes|Bundesbank(amts(inspektor|rat|mann)|tarifbeschäftigte)|für Hochbau|B\\.Sc (Betriebswirtschaftslehre)?|Master of Arts|Akademie|Bau|Filial|FinanzwirtSteuerberater|Gebiets|Kaufm.|Kur|Landwirtschafts|MD|N\\.N\\.|OrgBereiche|Pensions-Sicherungs-Verein|Technologien|Wirtschaftsinformatiker|für|weitere)(\\s+|$)","i"),
	// remove everything after first colon
	new RegExp(",.*$")
];


var namesake = function(str){
	for (var i = 0; i < regexes.length; i++) {
		if (regexes[i].test(str)) {
			return namesake(str.replace(regexes[i],"").replace(/^\s+|\s+$/g,''));
		}
	}
	return str;
};

module.exports = function(lines){

	var merge_next = null;
	var names = [];
	var head_position = null;

	lines.forEach(function(line, i){
		
		if (/^\(s\. Abschnitt/.test(line) || line === "–") return;
	
		if (/:$/.test(line)) {
			// title
			head_position = line
				.replace(/[: ]+$/,'')
				.replace(/^weitere /,'')
				.replace(/[\/\s\-]*in(nen)?\b/,'')
			return;
		};
		
		// try finding broken lines
		if ((i+1) < lines.length && merge_next === null) {
			// this is not the last element yet
			if ((line.length+lines[i+1].split(/[\.\-\s]+/).shift().length) >= 66) {
				// check if next line tests for section headline
				if (!(/:$/.test(lines[i+1]))) {

					if (lines[i+1].split(/\s+/).length === 1) {
						// yes
						merge_next = line;
						return;
					}
					
					// check for last word lower case
					if (/^[^A-Z\)\-]+$/.test(line.split(/\s+/g).pop())) {
						// yep
						merge_next = line;
						return;
					}
					
					// all those special cases
					var next_word = lines[i+1].split(/[\.\-\s]+/).shift();
					var last_word = line.split(/[\.\-\s]+/).pop();
					var last_char = line.split('').pop();
					if (
						next_word === "gleichzeitig" || 
						last_word === "gleichzeitig" || 
						next_word === "Sektion" || 
						last_word === "Sektion" || 
						next_word === "u" || 
						next_word === "&" || 
						next_word === "des" ||
						last_char === "," || 
						next_word === "und" || 
						next_word === "zugleich" || 
						next_word === "gleichz" || 
						next_word === "für" || 
						(last_word === "Vereinigung" && next_word === "Leitender") || 
						(last_word === "Fachbereich" && next_word === "Haushalt") || 
						(last_word === "Fachbereich" && next_word === "Haushalt,") || 
						(last_word === "Fachgruppe" && next_word === "Feinkost,") || 
						(last_word === "Ehemaliger" && next_word === "Soldaten,") || 
						(last_word === "Geschäftsführung" && next_word === "Managementgesellschaft") || 
						(last_word === "Vorstands" && next_word === "Wirtschaftsprüfer") || 
						/^\(.*\)$/.test(lines[i+1])
					) {
						// yey
						merge_next = line;
						return;
					}
					
				}
				
			}
			
			// some more broken line fixing
			switch ([line.split(/\s+/g).pop(), lines[i+1].split(/\s+/g).shift()].join(" ")) {
				case "MdB a.D.":
				case "Vorstandsvorsitzender und":
				case "ISO 27001LA":
				case "Beate Nowak":
				case "Felix W.":
					merge_next = line;
					return;
				break;
			}
		};
		
		if (merge_next !== null) {
			line = merge_next+" "+line;
			merge_next = null;
		}

		var name = namesake(line);
		
		// ignore empty names
		if (name === "") return;

		// fix some fucking pretentious titles, because #yolo
		var fixed = name
			.replace(/^S\.\s?D\./, "Seine Durchlaucht")
			.replace(/^S\.\s?H\./, "Seine Hoheit")
			.replace(/^S\.\s?E\./, "Seine Exzellenz")
			.replace(/^SKH/, "Seine Königliche Hoheit")

		var titles = line.replace(name,'');
		if (head_position !== null) titles+=" "+head_position;
		titles = titles.replace(/\s+/g,' ').replace(/^[\s,\.\-]+|[\s,\.\-]+$/g,'');
		
		names.push({
			name: fixed, 
			titles: titles,
			original: line
		});
		
	});
	
	return names;
	
};