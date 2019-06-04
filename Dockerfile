From node:10.12

WORKDIR "/var/www/html"
ADD ./ /var/www/html
RUN npm install
EXPOSE 8080
CMD ["npm","start"];
