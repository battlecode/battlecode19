# Battlecode API

Written in Django Rest Framework.

## First-Time Setup
Create a virtual environment.

`mkvirtualenv web -p python3`
`workon web`
`pip3 install -r requirements.txt`

## Database

Any time you start the backend, there must also be a Postgres instance up on `localhost:5432` (or whatever credentials are used in `battlecode/settings.py`) with a database named `battlecode`. You must make migrations and migrate the first time you start the website, or whenever you change the models. I like to run Postgres on Docker:

`docker run -p 5432:5432 -e POSTGRES_DB=battlecode --name bcweb -d postgres`

To stop or start the container: `docker stop bcweb` `docker start bcweb`

## Local Development

Always work in your virtual environment.

`workon web`

Install requirements using
`pip install -r requirements.txt`

Then start the backend:

`export DJANGO_SETTINGS_MODULE="dev_settings"`
`python manage.py makemigrations`
`python manage.py migrate`
`python manage.py runserver`

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Testing

`coverage run --source='.' manage.py test`
`coverage report`

To use the Python debugger: `from nose.tools import set_trace; set_trace()` (Note that Nose breaks the regular pdb.)

## Installing Packages

Django 2.0.3 and Webpack 4.0.1 are both very recently released. You may run into backwards compatibility issues with 3rd party packages, or deprecated functions. Try to refer to the most up-to-date documentation when possible. You may also run into problems if i.e. you have different version node modules installed globally instead of locally.

When installing a new Python package:
`pip install <package>`
`pip freeze > requirements.txt`

Always commit the most recent `requirements.txt`.
