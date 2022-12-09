import { getTimestamp } from '../support/helpers';

describe('Venues', () => {
  const timestamp = getTimestamp();
  const ctxVenue = {
    name: `Venue ${timestamp}`,
    city: 'Dallas',
    state: 'TX',
    genres: ['Alternative', 'Funk'],
    id: ''
  }

  it('should be possible to create a venue with minimum data and be redirected to the newly created venue page', () => {
    const successAlert = `Venue '${ctxVenue.name}' was successfully listed!`
    const upcomingShowsNum = 0
    const pastShowsNum = 0
    const upcomingShowsLabel = `${upcomingShowsNum} Upcoming Shows`
    const pastShowsLabel = `${pastShowsNum} Upcoming Shows`
    
    cy.visit('/')
    cy.get('[data-testid="post-venue"]').click()
    cy.get('[id="name"]').type(ctxVenue.name);
    cy.get('[id="city"]').type(ctxVenue.city);
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
    cy.get('.alert').should('contain.text', successAlert)
    cy.get('h1').should('contain.text', ctxVenue.name)
    ctxVenue.genres.forEach((genre) =>
      cy.get('.genres').should('contain.text', genre)
    )
    cy.get('.row').should('contain.text', ctxVenue.city)
    cy.get('.row').should('contain.text', ctxVenue.state)
    cy.get('h2').should('contain.text', upcomingShowsLabel)
    cy.get('h2').should('contain.text', pastShowsLabel)
    cy.location().then((location) => {
      const splitUrl = location.pathname.split('/')
      ctxVenue.id = splitUrl[splitUrl.length-1]
    })
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

  it('should be possible to delete a venue', () => {
    const successAlert = `Venue '${ctxVenue.id}' was successfully deleted!`
    cy.visit(`/venues/${ctxVenue.id}`)
    cy.get('[data-testid="delete-venue-button"]').click()
    cy.get('.alert').should('contain.text', successAlert)
    ctxVenue.id = '';
    cy.location('pathname').should('eq', '/')
  })

  it('should not be possible to submit an invalid venue form', () => {
    cy.visit('/venues/create')
    // TODO add validation also on form submit (clicking enter)
    // cy.get('form').submit()
    cy.get('[data-testid="create-venue-button"').click()
    // missing all fields
    cy.location('pathname').should('eq', '/venues/create')

    // missing name 
    // using an invalid State enum, 
    // missing city 
    // missing genre
  })

  after('delete venue', () => {
    // Delete the venue after test finished
    if (ctxVenue.id) {
      cy.request('POST', `/venues/${ctxVenue.id}/delete`).then((resp) => expect(resp.status).to.eq(200))
    }
  })
})