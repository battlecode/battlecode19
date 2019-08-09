# Start with a Python image.
FROM python@sha256:6eaf19442c358afc24834a6b17a3728a45c129de7703d8583392a138ecbdb092

# Some stuff that everyone has been copy-pasting
# since the dawn of time.
ENV PYTHONUNBUFFERED 1

# Install some necessary things.
RUN apt-get update
RUN apt-get install -y swig libssl-dev dpkg-dev netcat

# Copy all our files into the image.
RUN mkdir /code
WORKDIR /code
COPY requirements.txt /code/

# Install our requirements.
RUN pip install -r requirements.txt

COPY . /code/

CMD ["uwsgi", "--ini", "uwsgi.ini"]
