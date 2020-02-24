# Web Server Docker Image
## Web Server Docker 이미지 생성
```$xslt
$ git pull
$ ./docker.sh package build -v 0.1.0
```

## Web run
```bash
$ docker run -d -p 80:80 \
      -v ~/nginx/nginx.conf=/etc/nginx/nginx.conf \
      -v ~/nginx/conf.d=/etc/nginx/conf.d \
      -v ~/nginx/html=/usr/share/nginx/html \
      -v ~/nginx/admin=/usr/share/nginx/admin \
      --name kepri-web kepri-web:0.1.0

```
