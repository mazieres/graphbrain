package com.graphbrain.hgdb

import scala.collection.mutable.{Set => MSet}

/** Vertex store.
  *
  * Implements and hypergraph database on top of a key/Map store. 
  */
class VertexStore(storeName: String, val maxEdges: Int = 1000) extends VertexStoreInterface {
  val backend: Backend = new RiakBackend(storeName)

  /** Gets Vertex by it's id */
  override def get(id: String): Vertex = {
    val map = backend.get(id)
    val edges = str2iter(map.getOrElse("edges", "").toString).toSet
    val vtype = map.getOrElse("vtype", "")
    val extra = map.getOrElse("extra", "-1").toString.toInt
    vtype match {
      case "edg" => {
        val etype = map.getOrElse("etype", "").toString
        Edge(id, etype, edges, extra)
      }
      case "edgt" => {
        val label = map.getOrElse("label", "").toString
        val roles = str2iter(map.getOrElse("roles", "").toString).toList
        val rolen = map.getOrElse("rolen", "").toString
        EdgeType(id, label, roles, rolen, edges, extra)
      }
      case "txt" => {
        val text = map.getOrElse("text", "").toString
        TextNode(id, text, edges, extra)
      }
      case "url" => {
        val url = map.getOrElse("url", "").toString
        URLNode(id, url, edges, extra)
      }
      case "src" => {
        SourceNode(id, edges, extra)
      }
      case "img" => {
        val url = map.getOrElse("url", "").toString
        ImageNode(id, url, edges, extra)
      }
      case _  => ErrorVertex("unkown vtype: " + vtype)
    }
  }

  /** Adds Vertex to database */
  override def put(vertex: Vertex): Vertex = {
    backend.put(vertex.id, vertex.toMap)
    vertex
  }

  /** Updates vertex on database */
  override def update(vertex: Vertex): Vertex = {
    backend.update(vertex.id, vertex.toMap)
    vertex
  }

  /** Removes vertex from database */
  override def remove(vertex: Vertex): Vertex = {
    backend.remove(vertex.id)
    vertex
  }

  /** Adds relationship to database
    * 
    * An edge is creted and participant nodes are updated with a reference to that edge
    * in order to represent a new relationship on the database.
    */
  def addrel(edgeType: String, participants: Array[String]) = {
    val edge = new Edge(edgeType, participants)
    put(edge)

    for (id <- participants) {
      val vertex = get(id)
      val extra = if (vertex.extra >= 0) vertex.extra else 0
      var done = false
      while (!done) {
        val tryId = if (extra == 0) edge.id else edge.id + "/" + extra 
        update(vertex.addEdge(edge.id))
        done = true
      }
    }

    edge
  }

  /** Deletes relationship from database
    * 
    * The edge defining the relationship is removed and participant nodes are updated 
    * to drop the reference to that edge.
    */
  def delrel(edgeType: String, participants: Array[String]) = {
    val edge = new Edge(edgeType, participants)
    remove(edge)

    for (nodeId <- participants) update(get(nodeId).delEdge(edge.id))

    edge
  }

  
  def neighbors(nodeId: String, maxDepth: Int = 2): Set[(String, String)] = {
    val nset = MSet[(String, String)]()

    var queue = (nodeId, 0, "") :: Nil
    while (!queue.isEmpty) {
      val curId = queue.head._1
      val depth = queue.head._2
      val parent = queue.head._3
      queue = queue.tail

      if (!nset.exists(n => n._1 == curId)) {
        nset += ((curId, parent))
        val node = get(curId)

        if (depth < maxDepth)
          for (edgeId <- node.edges)
            queue = queue ::: (for (pid <- Edge.participantIds(edgeId)) yield (pid, depth + 1, curId)).toList
      }
    }

    nset.toSet
  }

  /** Gets all Edges that are internal to a neighborhood 
    * 
    * An Edge is considered inernal if all it's participating Nodes are containes in the
    * neighborhood.
    */
  def neighborEdges(nhood: Set[(String, String)]): Set[String] = {
    val nhoodIds = for (n <- nhood) yield n._1
    val eset = MSet[String]()
    for (n <- nhood) {
      val node = get(n._1)
      for (edgeId <- node.edges)
        if (Edge.participantIds(edgeId).forall(nhoodIds.contains(_)))
          eset += edgeId
    }
    eset.toSet
  }

  private def str2iter(str: String) = {
    (for (str <- str.split(',') if str != "")
      yield str.replace("$2", ",").replace("$1", "$")).toIterable
  }
}

object VertexStore {
  def apply(storeName: String) = new VertexStore(storeName)
} 