# battlecode-web-18

## First-Time Setup
Create a virtual environment.

`mkvirtualenv web -p python3`
`workon web`
`pip3 install -r requirements.txt`
`cd frontend`
`npm install`

## Local Development

Always work in your virtual environment.

`workon web`

There is currently a separate build and start process for the frontend (React) and backend (Django).

Frontend:
`npm run build`
`npm run start`

Backend:
`python manage.py makemigrations`
`python manage.py migrate`
`python manage.py runserver`

## Installing Packages

Django 2.0.3 and Webpack 4.0.1 are both very recently released. You may run into backwards compatibility issues with 3rd party packages, or deprecated functions. Try to refer to the most up-to-date documentation when possible. You may also run into problems if i.e. you have different version node modules installed globally instead of locally.

When installing a new Python package:
`pip install <package>`
`pip freeze > requirements.txt`

When installing a new Node package in `frontend/`:
`npm install --save <package>` or `npm install --save-dev <package>`

Always commit the most recent `package.json`, `package-lock.json`, and `requirements.txt`
