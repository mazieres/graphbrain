======================
Command-line interface
======================

GraphBrain provides a command-line interface that can be used to execute a variety of tasks.

Here's an overview of the interface::

   gbrain [-h] [--backend BACKEND] [--hg HG] [--infile INFILE]
               [--outfile OUTFILE] [--startdate STARTDATE] [--enddate ENDDATE]
               [--source SOURCE] [--log LOG] [--comments] [--fields FIELDS]
               [--model_type MODEL_TYPE] [--show_namespaces]
               command

   positional arguments:
     command               command to execute

   optional arguments:
     -h, --help            show help message
     --backend BACKEND     hypergraph backend (leveldb, null)
     --hg HG               hypergraph name
     --infile INFILE       input file
     --outfile OUTFILE     output file
     --startdate STARTDATE
                           start date
     --enddate ENDDATE     end date
     --source SOURCE       source can have multiple meanings.
     --log LOG             logging level.
     --comments            include comments
     --fields FIELDS       field names
     --model_type MODEL_TYPE
                           machine learning model type
     --show_namespaces     show namespaces

The only obligatory argument, command, is used to specify the task to perform. Each command uses a subset of the
optional arguments. Presented below are the details for each command.

Hypergraphs
===========

create
------

TBD

info
----

TBD

Knowledge extraction
====================

These are commands that extract knowledge from various source into hypergraphs.

reddit_reader
-------------

Applies a GraphBrain reader to the text of posts and comments extracted from Reddit::

   gbrain --hg <target hypergraph> --infile <reddit json file> [--comments] reddit_reader

The input file is a json file produced by the ``reddit_retriever`` command.
Comments are only processed if the optional ``--comments`` argument is used.

wordnet
-------

TBD

wikidata
--------

TBD

dbpedia
-------

TBD

dbpedia_wordnet
---------------

TBD

Data retrieval
==============

These are comands that retrieve data from external sources. This data can then be imported into hypergraphs through the
use of appropriate knowledge extraction commands.

reddit_retriever
----------------

Extracts posts and comments from Reddit, including metadata such as authors and timestamps::

   gbrain --source <subreddit> --outfile <reddit json file> --startdate <date> --enddate <date> reddit_retriever

``--source`` is used to specify the subreddit from where to retrieve posts and comments.
The output is a json file, that can then be used by the ``reddit_reader`` command.
``--startdate`` and ``--enddate`` are used to specify the time interval for data retrieval, in the format *yyyymmdd*.

For example, to retrieve data from http://reddit.com/r/worldnews, between 1-Jan-2017 and 15-Feb-2017::

   gbrain --source worldnews --outfile worldnews.json --startdate 20170101 --enddate 20170215 reddit_retriever

Interfaces
==========

ui
--

TBD


shell
-----

TBD

Reader
======

These commands are used to create datasets, perform learning and test the performance of the reader.
The reader is an AI module that consists of a pipline of stages that transform text in natural language into
hypergraphs.

reader_tests
------------

TBD

interactive_edge_builder
------------------------

Extracts posts and comments from Reddit, including metadata such as authors and timestamps::

   gbrain --outfile <sentence transformations file> interactive_edge_builder

This command opens an interactive session that allows the user to provide sentences and then manually perform the
appropriate transformations from the parse tree of these sentences into an initial hyperedge. For each sentence that
is manually parsed, a case is generated and appended to the output file.

The command ``generate_hypergen_cases`` can then be used to generate a training dataset from the ouput of this command.

A sentence parses dataset with a number of cases is provided with GraphBrain, at
``datasets/training_data/hyperedge_generator/parses.txt``.

generate_hypergen_cases
-----------------------

TBD

learn_hypergen
--------------

TBD

test_hypergen
-------------

TBD

extract_hypergen_test_sentences
-------------------------------

TBD

Tools
=====

extract_json_fields
-------------------

TBD

all2json
--------

TBD