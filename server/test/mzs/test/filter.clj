(ns mzs.test.filter
  (:require [clojure.test :refer :all]
             [mzs.filter :refer :all]))

(defn- is= [a b] (is (= a b)))

(deftest test-app
  (testing "empty track"
    (is= true (is-ad "some-url" "some-track"))))
