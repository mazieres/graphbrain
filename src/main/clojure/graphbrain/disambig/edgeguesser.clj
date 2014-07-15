(ns graphbrain.disambig.edgeguesser
  (:require [graphbrain.db.id :as id]
            [graphbrain.disambig.entityguesser :as eg]))

(defn eid->guess-eid
  [gbdb eid text ctxts]
  (let [ids (id/id->ids eid)
        guess (eg/guess-eid gbdb (second ids) text nil ctxts)]
    (if (id/eid? guess) guess
        (id/name+ids->eid
         (first ids)
         (second ids)
         (map #(eg/guess-eid gbdb % text nil ctxts) (drop 2 ids))))))

(defn guess
  [gbdb id text ctxts]
  (case (id/id->type id)
    :entity (eg/guess-eid gbdb id text nil ctxts)
    :edge (if (id/eid? id)
            (eid->guess-eid gbdb id text ctxts)
            (id/ids->id (map #(guess gbdb % text ctxts) (id/id->ids id))))
    id))
