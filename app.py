import os
import logging
import datetime
from flask import Flask, render_template

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

@app.context_processor
def inject_current_year():
    return {'current_year': datetime.datetime.now().year}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/metronome')
def metronome():
    return render_template('metronome.html')

@app.route('/notes')
def notes():
    return render_template('notes.html')

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html', error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('index.html', error="Internal server error"), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
