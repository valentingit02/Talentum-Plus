from cassandra.cluster import Cluster

cluster = Cluster(["localhost"])
session = cluster.connect()
session.execute("""
    CREATE KEYSPACE IF NOT EXISTS talentum
    WITH replication = {'class':'SimpleStrategy','replication_factor':'1'}
""")
session.set_keyspace("talentum")

# Historial de cambios
session.execute("""
CREATE TABLE IF NOT EXISTS cambios_usuario (
    id UUID PRIMARY KEY,
    nombre TEXT,
    fecha TIMESTAMP,
    descripcion TEXT
)
""")
