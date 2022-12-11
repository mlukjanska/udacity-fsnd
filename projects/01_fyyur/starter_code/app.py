#----------------------------------------------------------------------------#
# Imports
#----------------------------------------------------------------------------#

import sys
import dateutil.parser
import babel
from flask import Flask, render_template, request, flash, redirect, url_for
from flask_moment import Moment
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import logging
from logging import Formatter, FileHandler
from flask_wtf import Form
from sqlalchemy import JSON
from forms import *
from sqlalchemy.dialects.postgresql import JSON
import collections
import collections.abc
collections.Callable = collections.abc.Callable
#----------------------------------------------------------------------------#
# App Config.
#----------------------------------------------------------------------------#

app = Flask(__name__)
moment = Moment(app)
app.config.from_object('config')
db = SQLAlchemy(app)
migrate = Migrate(app, db) # bootstrap migrations

#----------------------------------------------------------------------------#
# Models.
#----------------------------------------------------------------------------#

class Venue(db.Model):
  __tablename__ = 'Venue'

  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String, nullable=False)
  city = db.Column(db.String(120), nullable=False)
  state = db.Column(db.String(120), nullable=False)
  address = db.Column(db.String(120), nullable=False)
  phone = db.Column(db.String(120), nullable=True)
  genres = db.Column(JSON, nullable=False)
  facebook_link = db.Column(db.String(120), nullable=True)
  image_link = db.Column(db.String(500), nullable=True)
  website_link = db.Column(db.String(500), nullable=True)
  looking_for_talent = db.Column(db.Boolean, default=False, nullable=True)
  seeking_description = db.Column(db.String(500), nullable=True)
  shows = db.relationship('Show', backref=db.backref('venues'), lazy="joined")

  def __repr__(self):
      return f'<Venue {self.id} {self.name}>'

class Artist(db.Model):
  __tablename__ = 'Artist'

  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String, nullable=False)
  city = db.Column(db.String(120), nullable=False)
  state = db.Column(db.String(120), nullable=False)
  phone = db.Column(db.String(120), nullable=True)
  genres = db.Column(JSON, nullable=False)
  facebook_link = db.Column(db.String(120), nullable=True)
  image_link = db.Column(db.String(500), nullable=True)
  website_link = db.Column(db.String(500), nullable=True)
  looking_for_venues = db.Column(db.Boolean, default=False, nullable=True)
  seeking_description = db.Column(db.String(500), nullable=True)
  shows = db.relationship('Show', backref=db.backref('artists'), lazy="joined")

  def __repr__(self):
      return f'<Artist {self.id} {self.name}>'

class Show(db.Model):
  __tablename__ = 'Show'

  id = db.Column(db.Integer, primary_key=True)
  artist_id = db.Column(db.Integer, db.ForeignKey('Artist.id'), nullable=False)
  venue_id = db.Column(db.Integer, db.ForeignKey('Venue.id'), nullable=False)
  start_time = db.Column(db.DateTime, nullable=False)
  artist = db.relationship('Artist', backref=db.backref('shows_artist'), cascade='all, delete')
  venue = db.relationship('Venue', backref=db.backref('shows_venue'), cascade='all, delete')

  def __repr__(self):
      return f'<Show {self.id} with Artist: {self.artist_id} and Venue: {self.venue_id}>'

#----------------------------------------------------------------------------#
# Filters.
#----------------------------------------------------------------------------#

def format_datetime(value, format='medium'):
  date = dateutil.parser.parse(value)
  if format == 'full':
      format="EEEE MMMM, d, y 'at' h:mma"
  elif format == 'medium':
      format="EE MM, dd, y h:mma"
  return babel.dates.format_datetime(date, format, locale='en')

app.jinja_env.filters['datetime'] = format_datetime

#----------------------------------------------------------------------------#
# Controllers.
#----------------------------------------------------------------------------#

@app.route('/')
def index():
  return render_template('pages/home.html')


#  Venues
#  ----------------------------------------------------------------

@app.route('/venues')
def venues():
  error = False
  data = []
  try: 
    all_locations = Venue.query.distinct(
        Venue.city,
        Venue.state
      ).order_by(
        Venue.city.desc(), 
        Venue.state.desc()
      ).all()
      
    for location in all_locations:
        data_item = {
          'city': location.city,
          'state': location.state,
          'venues': []
        }
        venues_in_location = Venue.query.filter_by(city=location.city).order_by('id').all()
        for venue in venues_in_location:
          upcoming_shows = []
          for show in venue.shows:
            if show.start_time > datetime.now():
              upcoming_shows.append({
                  'artist_id': show.artist_id,
                  'artist_name': show.artist.name,
                  'artist_image_link': show.artist.image_link,
                  'start_time': show.start_time.strftime("%m/%d/%Y, %H:%M")
              })
          venue_item = {
            'id': venue.id,
            'name': venue.name,
            'upcoming_shows': upcoming_shows,
            'num_upcoming_shows': len(upcoming_shows)
          }
          data_item['venues'].append(venue_item)
        data.append(data_item)
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      flash('An error occurred getting venues')
      return render_template('errors/500.html')
    else:    
      return render_template('pages/venues.html', areas=data)

@app.route('/venues/search', methods=['POST'])
def search_venues():
  error = False
  search_term = request.form.get('search_term', '')
  data = []
  try:
    venues = Venue.query.filter(Venue.name.ilike(f'%{search_term}%')).all()
    for venue in venues:
      upcoming_shows = []
      for show in venue.shows:
        if show.start_time > datetime.now():
          upcoming_shows.append({
              'artist_id': show.artist_id,
              'artist_name': show.artist.name,
              'artist_image_link': show.artist.image_link,
              'start_time': show.start_time.strftime("%m/%d/%Y, %H:%M")
          })
      venue_item = {
        'id': venue.id,
        'name': venue.name,
        'upcoming_shows': upcoming_shows,
        'num_upcoming_shows': len(upcoming_shows)
      }
      data.append(venue_item)
    response = {
      "count": len(venues),
      "data": data
    }
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      flash('An error occurred getting search results for term: ' + request.form.get('search_term', ''))
      return render_template('errors/500.html')
    else:    
      return render_template('pages/search_venues.html', results=response, search_term=request.form.get('search_term', ''))


@app.route('/venues/<int:venue_id>')
def show_venue(venue_id):
  error = False
  data = {}
  try:
    venue = Venue.query.get_or_404(venue_id)
    app.logger.debug("Retrieved venue id: '" + str(venue.id)  + "'.")
    past_shows = []
    upcoming_shows = []
    for show in venue.shows:
      show_item = {
        'artist_id': show.artist_id,
        'artist_name': show.artist.name,
        'artist_image_link': show.artist.image_link,
        'start_time': show.start_time.strftime("%m/%d/%Y, %H:%M")
      }
      if show.start_time <= datetime.now():
        past_shows.append(show_item)
      else:
        upcoming_shows.append(show_item)

    data = {
      "id": venue.id,
      "name": venue.name,
      "genres": venue.genres,
      "address": venue.address,
      "city": venue.city,
      "state": venue.state,
      "phone": venue.phone,
      "website": venue.website_link,
      "facebook_link": venue.facebook_link,
      "seeking_talent": venue.looking_for_talent,
      "seeking_description": venue.seeking_description,
      "image_link": venue.image_link,
      "past_shows": past_shows,
      "upcoming_shows": upcoming_shows,
      "past_shows_count": len(past_shows),
      "upcoming_shows_count": len(upcoming_shows),
    }
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
        flash('An error occurred getting venue with id: ' + str(venue_id))
        return render_template('errors/500.html')
    else:    
      return render_template('pages/show_venue.html', venue=data)

#  Create Venue
#  ----------------------------------------------------------------

@app.route('/venues/create', methods=['GET'])
def create_venue_form():
  form = VenueForm()
  return render_template('forms/new_venue.html', form=form)

@app.route('/venues/create', methods=['POST'])
def create_venue_submission():
  form = VenueForm(request.form, meta={'csrf': False})
  error = False
  venue_id = ''
  app.logger.debug("Venue form submission " + form.name.data)
  if form.validate():
    app.logger.debug("Form is valid for '" + form.name.data + "'.")
    try:
        name = form.name.data
        city = form.city.data
        state = form.state.data
        address = form.address.data
        phone = form.phone.data
        genres = form.genres.data
        facebook_link = form.facebook_link.data
        image_link = form.image_link.data
        website_link = form.website_link.data
        looking_for_talent = form.seeking_talent.data
        seeking_description = form.seeking_description.data

        venue = Venue(
          name=name, 
          city=city, 
          state=state, 
          address=address,
          phone=phone,
          genres=genres,
          facebook_link=facebook_link,
          image_link=image_link,
          website_link=website_link,
          looking_for_talent=looking_for_talent,
          seeking_description=seeking_description)

        db.session.add(venue)
        db.session.commit()
        app.logger.debug("Commited to DB venue_id '" + str(venue.id) + "'.")
        venue_id = venue.id
    except:
        error = True
        db.session.rollback()
        print(sys.exc_info())
    finally:
        db.session.close()
        if  error == True:
            flash("An error occurred. Venue '" + form.name.data + "' could not be listed.")
            return render_template('errors/500.html')
        else:    
            flash("Venue '" + form.name.data + "' was successfully listed!")
            return redirect(url_for('show_venue', venue_id=venue_id))
  else:
      message = []
      for field, err in form.errors.items():
          message.append(field + ' ' + '|'.join(err))
      flash('Errors ' + str(message))
      return render_template('errors/500.html')


# POST because then it is possible to return render home page
# If keeping DELETE method then AJAX call needs to be done and rendering does not work 
# the whole idea of AJAX in fact is not to rerender entire page
@app.route('/venues/<int:venue_id>/delete', methods=['POST'])
def delete_venue(venue_id):
  error = False
  try:
    venue = Venue.query.get(venue_id) 
    db.session.delete(venue)
    db.session.commit()
  except: 
    error = True
    db.session.rollback()
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      app.logger.debug("Error deleting Venue with id: " + str(venue_id))
      flash("An error occurred. Venue with id '" + str(venue_id) + "' could not be deleted.")
      return render_template('errors/500.html')
    else:    
      app.logger.debug("Successfully delete Venue with id: " + str(venue_id))
      flash("Venue '" + str(venue_id) + "' was successfully deleted!")
      return redirect(url_for('index'))

# POST because then it is possible to return render home page
# If keeping DELETE method then AJAX call needs to be done and rendering does not work 
# the whole idea of AJAX in fact is not to rerender entire page
@app.route('/artists/<int:artist_id>/delete', methods=['POST'])
def delete_artist(artist_id):
  error = False
  try:
    artist = Artist.query.get(artist_id) 
    db.session.delete(artist)
    db.session.commit()
  except: 
    error = True
    db.session.rollback()
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      app.logger.debug("Error deleting Artist with id: " + str(artist_id))
      flash("An error occurred. Artist with id '" + str(artist_id) + "' could not be deleted.")
      return render_template('errors/500.html')
    else:    
      app.logger.debug("Successfully delete Artist with id: " + str(artist_id))
      flash("Artist '" + str(artist_id) + "' was successfully deleted!")
      return redirect(url_for('index'))

#  Artists
#  ----------------------------------------------------------------
@app.route('/artists')
def artists():
  error = False
  data = []
  try: 
    artists = Artist.query.all()
    for artist in artists:
      artist_item = {
        'id': artist.id,
        'name': artist.name
      }
      data.append(artist_item)
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      flash('An error occurred getting venues')
      return render_template('errors/500.html')
    else:    
      return render_template('pages/artists.html', artists=data)
      
@app.route('/artists/search', methods=['POST'])
def search_artists():
  error = False
  search_term = request.form.get('search_term', '')
  data = []
  try:
    artists = Artist.query.filter(Artist.name.ilike(f'%{search_term}%')).all()
    for artist in artists:
      artist_item = {
        'id': artist.id,
        'name': artist.name,
        'num_upcoming_shows': len(artist.shows)
      }
      data.append(artist_item)
    response = {
        "count": len(artists),
        "data": data
    }
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      flash('An error occurred getting search results for term: ' + request.form.get('search_term', ''))
      return render_template('errors/500.html')
    else:    
      return render_template('pages/search_artists.html', results=response, search_term=request.form.get('search_term', ''))

@app.route('/artists/<int:artist_id>')
def show_artist(artist_id):
  error = False
  data = {}
  try:
    artist = Artist.query.get_or_404(artist_id)
    app.logger.debug("Retrieved artist id: '" + str(artist.id) + "'.")
    past_shows = []
    upcoming_shows = []
    for show in artist.shows:
      show_item = {            
        'venue_id': show.venue.id,
        'venue_name': show.venue.name,
        'venue_image_link': show.venue.image_link,
        'start_time': show.start_time.strftime("%m/%d/%Y, %H:%M")
      }
      if show.start_time <= datetime.now():
        past_shows.append(show_item)
      else:
        upcoming_shows.append(show_item)

    data = {
      "id": artist.id,
      "name": artist.name,
      "genres": artist.genres,
      "city": artist.city,
      "state": artist.state,
      "phone": artist.phone,
      "website": artist.website_link,
      "facebook_link": artist.facebook_link,
      "seeking_venue": artist.looking_for_venues,
      "seeking_description": artist.seeking_description,
      "image_link": artist.image_link,
      "past_shows": past_shows,
      "upcoming_shows": upcoming_shows,
      "past_shows_count": len(past_shows),
      "upcoming_shows_count": len(upcoming_shows),
    }
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
        flash('An error occurred getting artist with id: ' + str(artist_id))
        return render_template('errors/500.html')
    else:   
      return render_template('pages/show_artist.html', artist=data)

#  Update
#  ----------------------------------------------------------------
@app.route('/artists/<int:artist_id>/edit', methods=['GET'])
def edit_artist(artist_id):
  form = ArtistForm()
  error = False
  try:
    artist = Artist.query.get_or_404(artist_id)
    app.logger.debug("Retrieved for editing artist id: '" + str(artist.id) + "'.")
    form = ArtistForm(obj=artist)
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
        flash('An error occurred getting artist with id: ' + str(artist_id) + "' for editing.")
        return render_template('errors/500.html')
    else:   
      return render_template('forms/edit_artist.html', form=form, artist=artist)

@app.route('/artists/<int:artist_id>/edit', methods=['POST'])
def edit_artist_submission(artist_id):
  form = ArtistForm()
  error = False
  app.logger.debug("Artist form editing submission " + form.name.data)
  try:
    artist = Artist.query.get_or_404(artist_id)

    artist.name = form.name.data
    artist.city = form.city.data
    artist.state = form.state.data
    artist.phone = form.phone.data
    artist.genres = form.genres.data
    artist.facebook_link = form.facebook_link.data
    artist.image_link = form.image_link.data
    artist.website_link = form.website_link.data
    artist.looking_for_venues = form.seeking_venue.data
    artist.seeking_description = form.seeking_description.data

    db.session.commit()
    app.logger.debug("Commited to DB edited artist_id '" + str(artist.id) + "'.")
  except:
    error = True
    db.session.rollback()
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
        flash("An error occurred. Artist '" + form.name.data + "' could not be edited.")
        return render_template('errors/500.html')
    else:    
        flash("Artist '" + form.name.data + "' was successfully edited!")
        return redirect(url_for('show_artist', artist_id=artist_id))

@app.route('/venues/<int:venue_id>/edit', methods=['GET'])
def edit_venue(venue_id):
  form = VenueForm()
  error = False
  try:
    venue = Venue.query.get_or_404(venue_id)
    app.logger.debug("Retrieved for editing venue id: '" + str(venue.id) + "'.")
    form = VenueForm(obj=venue)
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
        flash('An error occurred getting venue with id: ' + str(venue_id) + "' for editing.")
        return render_template('errors/500.html')
    else:
      return render_template('forms/edit_venue.html', form=form, venue=venue)

@app.route('/venues/<int:venue_id>/edit', methods=['POST'])
def edit_venue_submission(venue_id):
  form = VenueForm()
  error = False
  app.logger.debug("Venue form editing submission " + form.name.data)
  try:
    venue = Venue.query.get_or_404(venue_id)

    venue.name = form.name.data
    venue.city = form.city.data
    venue.state = form.state.data
    venue.address = form.address.data
    venue.phone = form.phone.data
    venue.genres = form.genres.data
    venue.facebook_link = form.facebook_link.data
    venue.image_link = form.image_link.data
    venue.website_link = form.website_link.data
    venue.looking_for_talent = form.seeking_talent.data
    venue.seeking_description = form.seeking_description.data

    db.session.commit()
    app.logger.debug("Commited to DB edited venue_id '" + str(venue.id) + "'.")
  except:
    error = True
    db.session.rollback()
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
        flash("An error occurred. Venue '" + form.name.data + "' could not be edited.")
        return render_template('errors/500.html')
    else:    
        flash("Venue '" + form.name.data + "' was successfully edited!")
        return redirect(url_for('show_venue', venue_id=venue_id))


#  Create Artist
#  ----------------------------------------------------------------

@app.route('/artists/create', methods=['GET'])
def create_artist_form():
  form = ArtistForm()
  return render_template('forms/new_artist.html', form=form)

@app.route('/artists/create', methods=['POST'])
def create_artist_submission():
  form = ArtistForm(request.form, meta={'csrf': False})
  error = False
  artist_id = ''
  app.logger.debug("Artist form submission " + form.name.data)
  if form.validate():
    app.logger.debug("Form is valid for '" + form.name.data + "'.")
 
    try:
        name = form.name.data
        city = form.city.data
        state = form.state.data
        phone = form.phone.data
        genres = form.genres.data
        facebook_link = form.facebook_link.data
        image_link = form.image_link.data
        website_link = form.website_link.data
        looking_for_venues = form.seeking_venue.data
        seeking_description = form.seeking_description.data

        artist = Artist(
          name=name, 
          city=city, 
          state=state, 
          phone=phone,
          genres=genres,
          facebook_link=facebook_link,
          image_link=image_link,
          website_link=website_link,
          looking_for_venues=looking_for_venues,
          seeking_description=seeking_description)

        db.session.add(artist)
        db.session.commit()
        app.logger.debug("Commited to DB artist_id '" + str(artist.id) + "'.")
        artist_id = artist.id
    except:
        error = True
        db.session.rollback()
        print(sys.exc_info())
    finally:
        db.session.close()
        if  error == True:
            flash("An error occurred. Artist '" + form.name.data + "' could not be listed.")
            return render_template('errors/500.html')
        else:    
            flash("Artist '" + form.name.data + "' was successfully listed!")
            return redirect(url_for('show_artist', artist_id=artist_id))
  else:
      message = []
      for field, err in form.errors.items():
          message.append(field + ' ' + '|'.join(err))
      flash('Errors ' + str(message))
      return render_template('errors/500.html')

#  Shows
#  ----------------------------------------------------------------

@app.route('/shows')
def shows():
  error = False
  data = []
  try: 
    shows = Show.query.all()
    for show in shows:
      data_item = {
        'venue_id': show.venue.id,
        'venue_name': show.venue.name,
        'artist_id': show.artist.id,
        'artist_name': show.artist.name,
        'artist_image_link': show.artist.image_link,
        'start_time': show.start_time.strftime("%m/%d/%Y, %H:%M"),
      }
      data.append(data_item)
  except:
    error = True
    print(sys.exc_info())
  finally:
    db.session.close()
    if  error == True:
      flash('An error occurred getting venues')
      return render_template('errors/500.html')
    else:    
      return render_template('pages/shows.html', shows=data)

@app.route('/shows/create')
def create_shows():
  form = ShowForm()
  return render_template('forms/new_show.html', form=form)

@app.route('/shows/create', methods=['POST'])
def create_show_submission():
  form = ShowForm(request.form, meta={'csrf': False})
  error = False
  show_id = ''
  app.logger.debug("Shows form submission with artist id '" + form.artist_id.data + "' and venue id '" + form.venue_id.data + "'.")
  if form.validate():
    try:
      artist_id = form.artist_id.data
      venue_id = form.venue_id.data
      start_time = form.start_time.data

      show = Show(
        artist_id = artist_id,
        venue_id = venue_id,
        start_time = start_time
      )
      db.session.add(show)
      db.session.commit()
      app.logger.debug("Commited to DB show_id '" + str(show_id) + "'.")
      show_id = show.id
    except:
        error = True
        db.session.rollback()
        print(sys.exc_info())
    finally:
        db.session.close()
        if  error == True:
            flash("An error occurred. Show with artist id '" + form.artist_id.data + "' and venue id '" + form.venue_id.data +  "' could not be listed.")
            return render_template('errors/500.html')
        else:    
            flash("Show with artist id '" + form.artist_id.data + "' and venue id '" + form.venue_id.data + "' was successfully listed!")
            return redirect(url_for('shows'))
  else:
      message = []
      for field, err in form.errors.items():
          message.append(field + ' ' + '|'.join(err))
      flash('Errors ' + str(message))
      return render_template('errors/500.html')

@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def server_error(error):
    return render_template('errors/500.html'), 500


if not app.debug:
    file_handler = FileHandler('error.log')
    file_handler.setFormatter(
        Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
    )
    app.logger.setLevel(logging.INFO)
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.info('errors')

#----------------------------------------------------------------------------#
# Launch.
#----------------------------------------------------------------------------#

# Default port:
if __name__ == '__main__':
    app.run()

# Or specify port manually:
'''
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
'''
