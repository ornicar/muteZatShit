(ns mzs.handler
  (:require [compojure.core :refer [defroutes]]
            [mzs.routes :refer [app-routes]]
            [noir.util.middleware :refer [app-handler]]
            [compojure.route :as route]
            [taoensso.timbre :as timbre]
            [taoensso.timbre.appenders.rotor :as rotor]
            [environ.core :refer [env]]))

(defroutes default-routes
  (route/resources "/")
  (route/not-found "Not Found"))

(defn init
  "init will be called once when app is deployed as a servlet on
   an app server such as Tomcat put any initialization code here"
  [] (timbre/set-config!
       [:appenders :rotor]
       {:min-level :info
        :enabled? true
        :async? false ; should be always false for rotor
        :max-message-per-msecs nil
        :fn rotor/appender-fn})

  (timbre/set-config!
    [:shared-appender-config :rotor]
    {:path "mzs.log" :max-size (* 512 1024) :backlog 10})

  (timbre/info "mzs started successfully"))

(defn destroy
  "destroy will be called when your application shuts down, put any clean up code here"
  [] (timbre/info "mzs is shutting down..."))

(def app (app-handler
           ;; add your application routes here
           [app-routes default-routes]
           ;; add access rules here
           :access-rules []
           ;; serialize/deserialize the following data formats
           ;; available formats:
           ;; :json :json-kw :yaml :yaml-kw :edn :yaml-in-html
           :formats [:json-kw :edn]))
