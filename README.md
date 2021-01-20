# Template for oauth2 authentication

#### PostgreSQL Docker Set Up

`docker run -d --name my-postgres -e POSTGRES_PASSWORD=Mock123456 -v ${HOME}/Development/docker/postgres-data/:/var/lib/postgresql/data -p 5432:5432 postgres`

`docker exec -it my-postgres bash`

`psql -h localhost -U postgres`

```
CREATE DATABASE my_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8';
```

```
CREATE USER my_db_usr WITH PASSWORD 'Mock123456';
GRANT ALL PRIVILEGES ON DATABASE my_db TO my_db_usr;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO my_db_usr;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO my_db_usr;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO my_db_usr;
ALTER DATABASE my_db OWNER TO my_db_usr;
ALTER ROLE my_db_usr SET statement_timeout TO '5s';
```
