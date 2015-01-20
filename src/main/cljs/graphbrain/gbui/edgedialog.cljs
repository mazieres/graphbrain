(ns graphbrain.gbui.edgedialog
  (:require-macros [hiccups.core :as hiccups])
  (:require [jayq.core :as jq]
            [hiccups.runtime :as hiccupsrt]
            [graphbrain.gbui.globals :as g]
            [graphbrain.gbui.search :as search]
            [graphbrain.gbui.contexts :as contexts])
  (:use [jayq.core :only [$]]))

(def initialised (atom false))

(hiccups/defhtml edge-dialog-template
  [root-node-id]
  [:div {:class "modal" :role "dialog" :aria-hidden "true" :id "edge-modal"}
   [:div {:class "modal-dialog"}
    [:div {:class "modal-content"}
     [:div {:class "modal-header"}
      [:a {:class "close" :data-dismiss "modal"} "×"]
      [:h3 {:id "edge-dialog-title"}]
      [:form {:id "edge-dialog-form" :action (str "/n/" root-node-id) :method "post"}
       [:input {:id "op-field" :type "hidden" :name "op"}]
       [:input {:id "eid-field" :type "hidden" :name "eid"}]
       [:input {:id "edge-field" :type "hidden" :name "edge"}]
       [:input {:id "score-field" :type "hidden" :name "score"}]
       [:input {:id "targ-ctxt-field" :type "hidden" :name "targ-ctxt"}]
       [:div {:class "modal-body"}
        [:p {:id "edge-author"}]
        [:br]
        [:p {:id "change-meaning-label"} "Change meaning?"]
        [:div {:id "alt-entities-change"}]]
       [:div {:class "modal-footer"}
        [:a {:class "btn" :data-dismiss "modal"} "Close"]
        [:a {:id "new-meaning-button" :class "btn btn-warning"} "New Meaning"]
        [:a {:id "remove-button" :class "btn btn-danger"} "Remove"]]]]]]])

(defn- submit-remove
  []
  (jq/val ($ "#op-field") "remove")
  (.submit ($ "#edge-dialog-form")))

(defn- submit-new-meaning
  []
  (jq/val ($ "#op-field") "new-meaning")
  (.submit ($ "#edge-dialog-form")))

(defn init-dialog!
  []
  (let [html (edge-dialog-template @g/root-id)]
    (jq/append ($ "body") html)
    (jq/bind ($ "#remove-button") :click submit-remove)
    (jq/bind ($ "#new-meaning-button") :click submit-new-meaning)))

(defn- on-changed
  []
  (.reload js/window.location))

(defn- change-request!
  [node new-id]
  (jq/ajax {:type "POST"
            :url "/change"
            :data (str "edge=" (js/encodeURIComponent (:edge node))
                       "&old-id=" (js/encodeURIComponent (:id node))
                       "&new-id=" (js/encodeURIComponent new-id)
                       "&targ-ctxt=" (contexts/targ-ctxt (:ctxts node)))
            :dataType "text"
            :success on-changed}))

(defn- on-change
  [node new-id]
  (change-request! node new-id))

(defn show-edge-dialog
  [msg node snode]
  (if (not @initialised)
    (do
      (init-dialog!)
      (reset! initialised true)))
  (let [eid (:eid node)
        edge (:edge node)
        score (:score node)
        targ-ctxt (contexts/targ-ctxt (:ctxts node))
        link (:label snode)
        mod (= :entity (:type node))
        mod-button ($ "#new-meaning-button")
        rem-button ($ "#remove-button")]
    (if mod
      (jq/show mod-button)
      (jq/hide mod-button))

    (if (or (:static snode)
            (and (= :entity (:type node))
                 (not (:can-edit msg))))
      (jq/hide rem-button)
      (jq/show rem-button))
    
    (jq/val ($ "#eid-field") eid)
    (jq/val ($ "#edge-field") edge)
    (jq/val ($ "#score-field") score)
    (jq/val ($ "#targ-ctxt-field") targ-ctxt)
    (jq/html ($ "#edge-dialog-title") (:edge-text node))
    
    (if (:author msg)
      (jq/html ($ "#edge-author")
               (str "created by:  <a href='/n/"
                    @g/context
                    "/"
                    (:id (:author msg))
                    "'>"
                    (:username (:author msg))
                    "</a>")))
     
    (let [cm ($ "#change-meaning-label")]
      (if (and (not (:static snode))
               (:can-edit msg))
        (let [res (search/rendered-results msg)]
          (if (empty? res)
            (jq/hide cm)
            (do
              (jq/show cm)
              (jq/html ($ "#alt-entities-change") res))))
        (do
          (jq/hide cm)
          (jq/hide mod-button))))
     
    (if mod
      (let [results (:results msg)]
        (doseq [result results]
          (jq/bind
           ($ (str "#" (search/link-id (first result))))
           "click"
           #(on-change node (first result))))))
    (.modal ($ "#edge-modal") "show")))

(defn- results-received
  [msg node snode]
  (show-edge-dialog (cljs.reader/read-string msg)
                    node
                    snode))

(defn request!
  [node snode]
  (jq/ajax {:type "POST"
            :url "/edge-data"
            :data (str "id=" (:id node)
                       "&edge=" (.encodeURIComponent js/window (:edge node))
                       "&ctxt=" @g/context)
            :dataType "text"
            :success #(results-received % node snode)}))

(defn clicked
  [node snode]
  (if (some #{(:type node)} [:entity :edge])
    (request! node snode)
    (show-edge-dialog nil node snode)))
