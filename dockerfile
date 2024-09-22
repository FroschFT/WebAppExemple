FROM python:latest
EXPOSE 8081
WORKDIR /app
COPY ./app /app/app/
COPY ./extensions /app/extensions/
COPY ./static /app/static/
COPY ./templates /app/templates/
COPY ./config.py /app/
COPY ./main.py /app/
COPY ./requirements.txt /app/
# ENV DATABASE_URI=value2
ENV ENVORIMENT="PRD"
# RUN apt update
# RUN apt upgrade -y
# RUN pip install --upgrade pip
RUN pip install -r requirements.txt
ENTRYPOINT python main.py