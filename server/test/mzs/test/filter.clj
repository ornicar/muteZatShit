(ns mzs.test.filter
  (:require [clojure.test :refer :all]
             [mzs.filter :refer :all]))

;(defn- is= [a b] (is (= a b)))

(deftest test-app
  (testing "some track"
    (is (= false (is-ad "some-url" "some-track"))))
  (testing "exact match")
  	(is (= true (is-ad "http://FuzzyandGroovy.com" "FuzzyandGroovy")))
  (testing "ad track matches regexp and url")
  	(is (= true (is-ad "http://wabradio.com" "MyTrackTSTAG_")))
  (testing "ad track matches regexp not url")
  	(is (= false (is-ad "http://elsewhere.com" "MyTrackTSTAG_"))))
