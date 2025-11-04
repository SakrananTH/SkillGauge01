# db/manual

Manual SQL workspace for ad-hoc queries or temporary scripts.

Important:
- Files in this folder are NOT executed automatically by Docker Postgres.
- Use idempotent SQL when possible (CREATE IF NOT EXISTS, INSERT ... ON CONFLICT DO NOTHING) to avoid duplicate data.
- Wrap destructive scripts in explicit transactions if needed (BEGIN; ... COMMIT;), and review them carefully.

How to run a manual SQL script

Option A) From your host (psql installed):

```powershell
# Replace the path to the SQL file as needed
psql -h localhost -p 5432 -U skillgauge -d skillgauge -f \
  "c:\\Users\\sakra\\OneDrive\\เดสก์ท็อป\\Jsapps\\my-react-app\\db\\manual\\SkillGauge.session.sql"
```

Option B) Using Docker (no psql on host):

```powershell
# Copy the script into the running DB container, then execute it
docker cp "c:\\Users\\sakra\\OneDrive\\เดสก์ท็อป\\Jsapps\\my-react-app\\db\\manual\\SkillGauge.session.sql" skillgauge-db:/tmp/manual.sql

docker exec -it skillgauge-db psql -U skillgauge -d skillgauge -f /tmp/manual.sql
```

Notes:
- The running DB container name (from docker-compose) is `skillgauge-db`.
- Default credentials: user `skillgauge`, db `skillgauge`, password `skillgauge`.
- Keep sensitive data out of version control.
