import { getTimestamp } from '../support/helpers';

describe('Venues', () => {

  it('should be possible to view Venues page', () => {
    cy.visit('/venues')
  })
  
  it('should be possible to search for a venue in Venues page', () => {
    const timestamp = getTimestamp();
    const ctxVenue = `Venue ${timestamp}`
    cy.visit('/venues')
    cy.get('[name="search_term"]').type(ctxVenue);
  })

  it.only('should be possible to create a venue with minimum data and be redirected to the newly created venue page', () => {

    const timestamp = getTimestamp();
    const ctxVenue = {
      name: `Venue ${timestamp}`,
      city: 'Dallas',
      state: 'TX',
      genres: ['Alternative', 'Funk']
    }
    const successAlert = `Venue '${ctxVenue.name}' was successfully listed!`

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

    // Delete the venue after test finished
    cy.location().then((location) => {
      const splitUrl = location.pathname.split('/')
      const venueId = splitUrl[splitUrl.length-1]
      cy.request('DELETE', `/venues/${venueId}`).then((resp) => expect(resp.status).to.eq(200))
    })
  })

  it('should not be possible to submit an invalid venue form', () => {
    cy.visit('/venues/create')
    // using an invalid State enum, 
    // missing city 
    // missing name 
    // missing genre
  })

})