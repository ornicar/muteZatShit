(ns mzs.filter)


(defn is-ad
	"Tell if track is an ad"
	[url track] 
	(let [urls { 
			"http://FuzzyandGroovy.com" #{#"FuzzyandGroovy"} 
			"http://4USmoothJazz.com" #{#"4USmoothJazz"}
			"http://wabradio.com" #{#"^.*TSTAG_"}
			}
			patterns (get urls url)]
			(and (not (nil? patterns)) (not (nil? (some (fn[x](re-matches x track)) patterns))))
	))


