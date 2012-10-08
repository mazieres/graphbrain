package com.graphbrain.nlp

import com.graphbrain.hgdb.Vertex




abstract class ResponseType 
  
case class HardcodedResponse(responseStrings: List[String]) extends ResponseType {
  override def toString: String = "HardCoded" + responseStrings.toString;
}
case class GraphResponse(hypergraphList: List[(List[Vertex], Vertex)]) extends ResponseType {
  override def toString: String = "Graph" + hypergraphList.toString;
}
case class QuestionFactResponse(responseStrings: List[String], hypergraphList: List[(List[Vertex], Vertex)]) extends ResponseType {
  override def toString = "QuestionFact" + responseStrings.toString + " " + hypergraphList.toString;
}
case class SearchResponse(searchStrings: List[String]) extends ResponseType  {
  override def toString = "Search" + searchStrings.toString;
}

