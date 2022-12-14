import { getTimestamp } from '../support/helpers';

/**
 * Note: The tests can be further enhanced to be isolated, currently they should be run in sequence
 */

describe('Venues', () => {
  const timestamp = getTimestamp();
  const ctxVenue = {
    name: `Venue ${timestamp}`,
    city: 'Dallas',
    state: 'TX',
    address: 'Address Venue 1',
    genres: ['Alternative', 'Funk'],
    id: ''
  }
  const upcomingShowsNum = 0
  const pastShowsNum = 0
  const upcomingShowsLabel = `${upcomingShowsNum} Upcoming Shows`
  const pastShowsLabel = `${pastShowsNum} Upcoming Shows`

  it('should be possible to create a venue with minimum data and be redirected to the newly created venue page', () => {
    const successAlert = `Venue '${ctxVenue.name}' was successfully listed!`
    
    cy.visit('/')
    cy.get('[data-testid="post-venue"]').click()
    cy.get('[id="name"]').type(ctxVenue.name);
    cy.get('[id="city"]').type(ctxVenue.city);
    cy.get('[id="address"]').type(ctxVenue.address);
    cy.get('[id="state"]')
      .select(ctxVenue.state)
      .invoke('val')
      .should('deep.equal', ctxVenue.state)
    cy.get('[id="genres"]')
      .select(ctxVenue.genres)
      .invoke('val')
      .should('deep.equal', ctxVenue.genres)
    cy.get('form').submit()

    cy.url().as('newVenueUrl').should('include', '/venues/')
    cy.location().then((location) => {
      const splitUrl = location.pathname.split('/');
      ctxVenue.id = splitUrl[splitUrl.length - 1];
    });
    checkNotification(successAlert);
    checkVenueFields(ctxVenue, upcomingShowsLabel, pastShowsLabel);
  })

  it('should be possible to view Venues list page and see newly created venue in the list', () => {
    cy.visit('/venues')
    cy.get('[id="content"]').should('contain.text', ctxVenue.city)
    cy.get('[id="content"]').should('contain.text', ctxVenue.state)
    cy.get('.items').should('contain.text', ctxVenue.name)
  })
  
  it('should be possible to search for a venue with uppercase in Venues page', () => {
    const searchTerm = ctxVenue.name.toUpperCase();
    const searchResultHeader = `Number of search results for "${searchTerm}": 1`
    cy.visit('/venues')
    cy.get('[name="search_term"]').type(`${searchTerm}{enter}`);
    cy.get('h3').should('contain.text', searchResultHeader)
    cy.get('.items').should('contain.text', ctxVenue.name)
  })

  it('should be possible to search for a venue with lowercase in Venues page', () => {
    const searchTerm = ctxVenue.name.toLowerCase();
    const searchResultHeader = `Number of search results for "${searchTerm}": 1`
    cy.visit('/venues')
    cy.get('[name="search_term"]').type(`${searchTerm}{enter}`);
    cy.get('h3').should('contain.text', searchResultHeader)
    cy.get('.items').should('contain.text', ctxVenue.name)
  })

  it('should be possible to edit venue', () => {
    const editFormHeading = `Edit venue ${ctxVenue.name}`
    cy.visit(`/venues/${ctxVenue.id}`)
    cy.get('[data-testid="edit-venue-button"]').click()
    cy.get('h3.form-heading').should('contain.text', editFormHeading)
    cy.get('[id="name"]').should('have.value', ctxVenue.name)
    cy.get('[id="city"]').should('have.value', ctxVenue.city)
    cy.get('[id="state"]').invoke('val').should('deep.equal', ctxVenue.state)
    cy.get('[id="genres"]').invoke('val').should('deep.equal', ctxVenue.genres)

    ctxVenue.name = `${ctxVenue.name} Edited`
    ctxVenue.city = `${ctxVenue.city} Edited`
    ctxVenue.address = `${ctxVenue.address} Edited`
    const successAlert = `Venue '${ctxVenue.name}' was successfully edited!`

    cy.get('[id="name"]').clear().type(ctxVenue.name);
    cy.get('[id="city"]').clear().type(ctxVenue.city);

    cy.get('[data-testid="post-edited-venue"]').click()
    checkNotification(successAlert);
    checkVenueFields(ctxVenue, upcomingShowsLabel, pastShowsLabel);
  })

  it('should be possible to delete a venue', () => {
    const successAlert = `Venue '${ctxVenue.id}' was successfully deleted!`
    cy.visit(`/venues/${ctxVenue.id}`)
    cy.get('[data-testid="delete-venue-button"]').click()
    cy.get('.alert').should('contain.text', successAlert)
    ctxVenue.id = '';
    cy.location('pathname').should('eq', '/')
  })

  it('should not be possible to submit an invalid venue form', () => {
    const errorAlert = "Errors ['name This field is required.', 'city This field is required.', 'address This field is required.', 'genres This field is required.']"
    cy.visit('/venues/create')
    cy.get('form').submit()
    // missing all fields
    cy.location('pathname').should('eq', '/venues/create')
    checkNotification(errorAlert)
  })

  after('delete venue', () => {
    // Delete the venue after test finished
    if (ctxVenue.id) {
      cy.request('POST', `/venues/${ctxVenue.id}/delete`).then((resp) => expect(resp.status).to.eq(200))
    }
  })
})

function checkNotification(alert) {
  cy.get('.alert').should('contain.text', alert);
}

function checkVenueFields(venue, upcomingShowsLabel, pastShowsLabel) {
  cy.get('h1').should('contain.text', venue.name);
  venue.genres.forEach((genre) => cy.get('.genres').should('contain.text', genre)
  );
  cy.get('.row').should('contain.text', venue.city);
  cy.get('.row').should('contain.text', venue.state);
  cy.get('h2').should('contain.text', upcomingShowsLabel);
  cy.get('h2').should('contain.text', pastShowsLabel);
}