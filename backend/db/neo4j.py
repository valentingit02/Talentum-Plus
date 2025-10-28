from neo4j import GraphDatabase

# Usar localhost cuando lo corrés en tu PC
uri = "bolt://localhost:7687"
driver = GraphDatabase.driver(uri, auth=("neo4j", "test1234"))

def get_driver():
    return driver
