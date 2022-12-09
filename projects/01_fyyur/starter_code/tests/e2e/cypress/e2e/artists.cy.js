import { getTimestamp } from '../support/helpers';

describe('Artists', () => {

  it('should be possible to view Artists page', () => {
    cy.visit('/artists')
  })
  
  it('should be possible to search for a venue in Artists page', () => {
    const timestamp = getTimestamp();
    const ctxArtist = `Artist ${timestamp}`
    cy.visit('/artists')
    cy.get('[name="search_term"]').type(ctxArtist);
  })

  it('should be possible to create a venue and be redirected to the newly created venue page', () => {
    cy.visit('/')
    cy.get('[data-testid="post-artist"]').click()
  })

  it('should not be possible to submit an invalid venue form', () => {
    cy.visit('/artists/create')
    // using an invalid State enum, 
    // missing city 
    // missing name 
    // missing genre
  })

})