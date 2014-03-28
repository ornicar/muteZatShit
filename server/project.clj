(defproject mzs "0.1.0-SNAPSHOT"
  :description "Mute Zat Shit - the web radio ad blocker"
  :url "mzs.iliaz.com"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [clj-http "0.9.1"]
                 [lib-noir "0.8.1"]
                 [compojure "1.1.6"]
                 [ring-server "0.3.1"]
                 [com.taoensso/timbre "3.0.0"]
                 [com.taoensso/tower "2.0.1"]
                 [environ "0.4.0"]]

  :repl-options {:init-ns mzs.repl}
  :plugins [[lein-ring "0.8.10"]
            [lein-environ "0.4.0"]]
  :ring {:handler mzs.handler/app
         :init    mzs.handler/init
         :destroy mzs.handler/destroy}
  :profiles
  {:uberjar {:aot :all}
   :production {:ring {:open-browser? false
                       :stacktraces?  false
                       :auto-reload?  false}}
   :dev {:dependencies [[ring-mock "0.1.5"]
                        [ring/ring-devel "1.2.1"]]
         :env {:dev true}}}
  :min-lein-version "2.0.0")
