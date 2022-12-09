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

  it.only('should be possible to create a venue and be redirected to the newly created venue page', () => {
    cy.visit('/')
    cy.get('[data-testid="post-venue"]').click()
  })

  it('should not be possible to submit an invalid venue form', () => {
    cy.visit('/venues/create')
    // using an invalid State enum, 
    // missing city 
    // missing name 
    // missing genre
  })

})