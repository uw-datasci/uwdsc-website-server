#!/bin/bash

# MongoDB URI without the database name, e.g. mongodb+srv://xxx@xxx.mongodb.net
uri=""
prodDB="membershipSystem"
testDB="newTermAppModels"

# Create backup directory if it doesn't exist
mkdir -p backup

# Dump the production database
mongodump --uri="$uri" --db="$prodDB" --out=backup/

# Restore to test database with namespace transformation
mongorestore --uri="$uri" --dir="backup" --nsFrom="${prodDB}.*" --nsTo="${testDB}.*"
