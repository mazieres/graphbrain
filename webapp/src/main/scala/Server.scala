package com.graphbrain.webapp

import java.net.URL
import com.codahale.logula.Logging
import org.apache.log4j.Level
import unfiltered.request._
import unfiltered.Cookie

import com.graphbrain.hgdb.VertexStore
import com.graphbrain.hgdb.SimpleCaching
import com.graphbrain.hgdb.UserManagement
import com.graphbrain.hgdb.UserNode
import com.graphbrain.nlp.SentenceParser
import com.graphbrain.nlp.POSTagger


object Server {
  val logger = org.clapper.avsl.Logger(Server.getClass)
  var http: unfiltered.netty.Http = null
  var prod: Boolean = false

  val store = new VertexStore("gb") with SimpleCaching with UserManagement

  def realIp(req: HttpRequest[Any]) = {
    val headers = req.headers("X-Forwarded-For")
    if (headers.hasNext)
      headers.next
    else
      req.remoteAddr
  }

  def getUser(cookies: Map[String, Any]): UserNode = {
    val username = cookies("username") match {
      case Some(Cookie(_, value, _, _, _, _)) => value
      case _ => null
    } 
    val session = cookies("session") match {
      case Some(Cookie(_, value, _, _, _, _)) => value
      case _ => null
    }
    if ((username == null) || (session == null)) {
      null
    }
    else {
      val userNode = store.getUserNodeByUsername(username)
      if (userNode == null) {
        null
      }
      else {
        if (store.checkSession(userNode, session)) {
          userNode
        }
        else {
          null
        }
      }
    }
  }

  def start(prod: Boolean) = {
    this.prod = prod
    http = unfiltered.netty.Http(8080)
      .handler(GBPlan)
      .handler(NodePlan)
      .resources(new URL(getClass().getResource("/robots.txt"), "."))
      
    http.run
  }

  def main(args: Array[String]) {
    Logging.configure { log =>
      log.registerWithJMX = true

      log.level = Level.INFO
      log.loggers("com.graphbrain.webapp") = Level.INFO

      log.console.enabled = false

      log.file.enabled = true
      log.file.filename = "./logs/webapp.log"
      log.file.threshold = Level.INFO
      log.file.maxSize = 1024 * 1024 // Kb
      log.file.retainedFiles = 5 // keep five old logs around

      log.syslog.enabled = false
    }

    val sparser = new SentenceParser()
    val results = sparser.parseSentence("\"Chih-Chun\" is a \"toad\"")
    println(results)

    start((args.length > 0) && (args(0) == "prod"))
  }
}
