#!/bin/bash

pem=~/keys/cloudxpert.pem

echo ""
echo ">>>> sync web started."
rsync -avz -e "ssh -i $pem" --exclude=".git" ../ cloud-user@x1-portal-api:/home/cloud-user/nginx/web/
echo ">>>> sync web ended."
