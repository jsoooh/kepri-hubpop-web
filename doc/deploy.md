# PaaSXpert-Portal WEB Service ##

## Description ##

   PaaSXpert-Portal Web Service is made by NGINX and AngulaJS 1.5
   
## Setting ##
1. Nginx Web Server Install

   ```
   $ sudo apt-get install python-software-properties
   $ sudo add-apt-repository ppa:nginx/stable
   $ sudo apt-get update
   $ sudo apt-get install nginx
   ```

2. Git clone
    - html 디랙토리 생성

    ```
    $ cd ~
    $ makedir public_html
    $ cd public_html
    ```

    - x1-portal-web git clone

    ```
    $ git clone git@github.com:CrossentCloud/x1-portal-web.git
    ```

3. Nginx 설정 (Portal)
   - 각각의 IP에 대한 Hosts 설정 필요

    ```
    $ sudo vi /etc/hosts
    127.0.0.1 uaa-api-vip
    127.0.0.1 comm-api-vip
    127.0.0.1 iaas-api-vip
    127.0.0.1 paas-api-vip
    127.0.0.1 monit-api-vip
    
    
    $ sudo rm -f /etc/nginx/sites-enabled/default
    $ sudo vi /etc/nginx/sites-enabled/Web
    
    # Local Portal Web
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
    
        root /home/ubuntu/public_html/x1-portal-web;
    
        index console.html;
    
        server_name www.{domain_name};
    
        client_max_body_size    500m;
        client_body_buffer_size 256k;
        
        location / {
            try_files $uri $uri/ =404;
            proxy_connect_timeout       90;
            proxy_send_timeout          90;
            proxy_buffers              4 32k;
            proxy_temp_file_write_size  64k;
        }
        
        ## uaa 로컬 개발 시 필요   
        location ^~ /uaa/ {
           proxy_pass http://uaa-api-vip:8080;
        }

        location ^~ /comm-api/ {
           rewrite ^/comm-api/(.*)$ /$1 break;
           proxy_pass http://comm-api-vip:8081;
        }
    
        location ^~ /iaas-api/ {
            rewrite ^/iaas-api/(.*)$ /$1 break;
            proxy_pass http://iaas-api-vip:8082;
        }

        location ^~ /paas-api/ {
            rewrite ^/paas-api/(.*)$ /$1 break;
            proxy_pass http://paas-api-vip:8083;
        }

        location ^~ /monit-api/ {
            rewrite ^/monit-api/(.*)$ /$1 break;
            proxy_pass http://monit-api-vip:8084;
        }
    }

    ```

4. Nginx 설정 (Admin)

    ```
    $ sudo vi /etc/nginx/sites-enabled/AdmWeb
    
    # Local Admin Web
    
    server {
        listen 80;
        listen [::]:80;
        
        root /home/ubuntu/public_html/x1-portal-web;
    
        index admin.html;
    
        server_name admin.{domain_name};
    
        client_max_body_size    500m;
        client_body_buffer_size 256k;
        
        location / {
            try_files $uri $uri/ =404;
            proxy_connect_timeout       90;
            proxy_send_timeout          90;
            proxy_buffers              4 32k;
            proxy_temp_file_write_size  64k;
        }
    
        location ^~ /comm-api/ {
           rewrite ^/comm-api/(.*)$ /$1 break;
           proxy_pass http://{comm-api-vip}:8081;
        }
    
        location ^~ /iaas-api/ {
            rewrite ^/iaas-api/(.*)$ /$1 break;
            proxy_pass http://{iaas-api-vip}:8082;
        }

        location ^~ /paas-api/ {
            rewrite ^/paas-api/(.*)$ /$1 break;
            proxy_pass http://{paas-api-vip}:8083;
        }

        location ^~ /monit-api/ {
            rewrite ^/monit-api/(.*)$ /$1 break;
            proxy_pass http://{monit-api-vip}:8084;
        }

        location /comm/img/ {
            alias /home/ubuntu/workspace/x1-portal-web/img/;
            autoindex on;
        }
        
        location /comm/fonts/ {
            alias /home/ubuntu}/workspace/x1-portal-web/fonts/;
            autoindex on;
        }
    }
    
    ```

6. Nginx 실행/정지/재실행

    ```
    # Nginx start
    $ sudo service nginx start

    # Nginx stop
    $ sudo service nginx stop

    # Nginx restart
    $ sudo service nginx restart
    ```

7. Local 환경을 위한 설정
    - index.html, admin.html
    
    ```javascript
    var _MODE_ = "PRD"; // PRD, DEV, DEBUG
    =>
    var _MODE_ = "DEBUG"; // RUN, DEV, DEBUG
    ```
