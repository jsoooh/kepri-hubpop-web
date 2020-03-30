# PaaSXpert-Portal WEB Service ##

## Description ##

   PaaSXpert-Portal Web Service is made by NGINX and AngulaJS 1.5
   
## Setting ##

- [WEB 설정](doc/deploy.md)


## 허브팝 web 소스 반영
- hubpop web 중지 : centos로 ssh 접속
```bash
$ docker stop kepri-web
```
- 기존 파일을 백업 한다. : centos로 ssh 접속
```bash
$ mv ~/xpert/html/kepri-hubpop-web ~/xpert/html/kepri-hubpop-web_20200330
```
- sftp를 통해 centos로 접속 하여 kepri-hubpop-web.tgz를  ~/xpert/html/ 에 업로드 한다.
- sftp를 통해 centos로 접속 하여 kepri-admin-web.tgz를  ~/xpert/html/ 에 업로드 한다.
- 압축 풀기 : centos로 ssh 접속
```bash
$ cd ~/xpert/html/
$ tar xvfz kepri-hubpop-web.tgz
$ tar xvfz kepri-admin-web.tgz
```
- hubpop web 시작 : centos로 ssh 접속
```bash
$ docker start kepri-web

```
