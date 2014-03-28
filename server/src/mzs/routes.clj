(ns mzs.routes
  (:use compojure.core)
  (:require [clj-http.client :as http]))

(defn home []
  "homepage")

(defn metadata [url]
  (let [res (http/get url {:headers {"Icy-Metadata" 1}
                           :socket-timeout 1000  ;; in milliseconds
                           :conn-timeout 1000    ;; in milliseconds
                           })]
    res))

(defroutes app-routes
  (GET "/" [] (home))
  (GET "/metadata" [url] (metadata url)))
