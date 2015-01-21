(ns graphbrain.web.handlers.change
  (:require [graphbrain.web.common :as common]
            [graphbrain.web.contexts :as contexts]
            [graphbrain.db.gbdb :as gb]
            [graphbrain.db.id :as id]
            [graphbrain.db.maps :as maps]
            [graphbrain.db.entity :as entity]
            [graphbrain.db.searchinterface :as si]
            [graphbrain.db.perms :as perms]))

(defn reply
  []
  (pr-str {:type :change}))

(defn reply-no-perms
  []
  (pr-str {:type :error
           :msg "Sorry, you don't have permissions to edit this GraphBrain."}))

(defn process
  [edge-id old-id new-id targ-ctxt]
  (let [edge (maps/id->edge edge-id)
        old-eid (gb/id->eid common/gbdb old-id)
        new-eid (gb/id->eid common/gbdb new-id)
        ids (id/id->ids edge-id)
        new-ids (map #(if (= % old-eid) new-eid %)
                     ids)
        new-edge (maps/ids->edge new-ids)]
    (gb/replace! common/gbdb edge old-eid new-eid targ-ctxt))
  (reply))

(defn handle
  [request]
  (let [user (common/get-user request)
        edge ((request :form-params) "edge")
        old-id ((request :form-params) "old-id")
        new-id ((request :form-params) "new-id")
        targ-ctxt ((request :form-params) "targ-ctxt")]
    (if (perms/can-edit? common/gbdb (:id user) targ-ctxt)
      (process edge old-id new-id targ-ctxt)
      (reply-no-perms))))