#!/bin/sh

web_home=/home/centos/xpert
nginx_home=/home/centos/nginx

docker run -d -p 80:80 -p 8099:8099 \
      -v ${nginx_home}/nginx.conf:/etc/nginx/nginx.conf \
      -v ${nginx_home}/conf.d:/etc/nginx/conf.d \
      -v ${nginx_home}/kepri-download:/usr/share/nginx/kepri-download \
      -v ${web_home}/kepri-hubpop-web:/usr/share/nginx/html/kepri-hubpop-web \
      -v ${web_home}/kepri-admin-web:/usr/share/nginx/admin/kepri-admin-web \
      --name kepri-web kepri-web:0.1.0
