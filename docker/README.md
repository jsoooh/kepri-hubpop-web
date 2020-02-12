# Web Server Docker Image
## Web Server Docker 이미지 생성
```$xslt
$ git pull
$ ./docker.sh package build -v 0.1.0
```

## 이미지 push (cressent: docker hub 계정)
```bash
$ docker login
id
pw
$ ./docker.sh push -s crossentcx -v 0.1.0
```

## 직접 입력 push  (cressent: docker hub 계정)
```
$ docker login
id
pw
$ docker image rm crossentcx/cx-web:0.1.0
$ docker image tag cx-web crossentcx/cx-web:0.1.0
$ docker push crossentcx/cx-web:0.1.0
```
