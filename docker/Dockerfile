#docker pull nginx:1.16.1-alpine
FROM nginx:1.16.1-alpine

LABEL maintainer="crossent"

RUN rm -f /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf

ADD conf/nginx.conf /etc/nginx/nginx.conf
ADD conf/default.conf /etc/nginx/conf.d/default.conf

#RUN rm -rf /usr/share/nginx/html

#ADD dist/html.tar.gz /usr/share/nginx/
#RUN chown -R nginx:nginx /usr/share/nginx/html

#ADD dist/admin.tar.gz /usr/share/nginx/
#RUN chown -R nginx:nginx /usr/share/nginx/admin

# log
VOLUME ["/var/log/nginx"]

EXPOSE 80

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
