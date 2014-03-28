(ns mzs.routes
  (:use compojure.core))

(defn home []
  "homepage")

(defn metadata [url]
  url)

(defroutes app-routes
  (GET "/" [] (home))
  (GET "/metadata" [url] (metadata url)))
