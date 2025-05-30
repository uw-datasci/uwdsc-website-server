$uri = "" # Without the database name, e.g. mongodb+srv://xxx@xxx.mongodb.net
$prodDB = "membershipSystem"
$testDB = "dbMigrationTest2"

mongodump --uri=$uri --db=$prodDB --out=backup/

mongorestore --uri=$uri --dir="backup" --nsFrom="${prodDB}.*" --nsTo="${testDB}.*"