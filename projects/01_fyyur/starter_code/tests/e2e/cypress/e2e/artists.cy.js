import { getTimestamp } from '../support/helpers';

describe('Artists', () => {
  const timestamp = getTimestamp();
  const ctxArtist = {
    name: `Artist ${timestamp}`,
    city: 'Dallas',
    state: 'TX',
    genres: ['Alternative', 'Funk'],
    id: ''
  }

  it('should be possible to create an artist entry with minimum data and be redirected to the newly created artist page', () => {
    const successAlert = `Artist '${ctxArtist.name}' was successfully listed!`
    const upcomingShowsNum = 0
    const pastShowsNum = 0
    const upcomingShowsLabel = `${upcomingShowsNum} Upcoming Shows`
    const pastShowsLabel = `${pastShowsNum} Upcoming Shows`
    
    cy.visit('/')
    cy.get('[data-testid="post-artist"]').click()
    cy.get('[id="name"]').type(ctxArtist.name);
    cy.get('[id="city"]').type(ctxArtist.city);
    cy.get('[id="state"]')
      .select(ctxArtist.state)
      .invoke('val')
      .should('deep.equal', ctxArtist.state)
    cy.get('[id="genres"]')
      .select(ctxArtist.genres)
      .invoke('val')
      .should('deep.equal', ctxArtist.genres)
    cy.get('form').submit()

    cy.url().as('newArtistUrl').should('include', '/artists/') 
    cy.get('.alert').should('contain.text', successAlert)
    cy.get('h1').should('contain.text', ctxArtist.name)
    ctxArtist.genres.forEach((genre) =>
      cy.get('.genres').should('contain.text', genre)
    )
    cy.get('.row').should('contain.text', ctxArtist.city)
    cy.get('.row').should('contain.text', ctxArtist.state)
    cy.get('h2').should('contain.text', upcomingShowsLabel)
    cy.get('h2').should('contain.text', pastShowsLabel)
    cy.location().then((location) => {
      const splitUrl = location.pathname.split('/')
      ctxArtist.id = splitUrl[splitUrl.length-1]
    })
  })

  it('should be possible to view Artists list page and see newly created artist in the list', () => {
    cy.visit('/artists')
    cy.get('.items').should('contain.text', ctxArtist.name)
  })

  it('should be possible to search for an artist with uppercase in Artists page', () => {
    const searchTerm = ctxArtist.name.toUpperCase();
    const searchResultHeader = `Number of search results for "${searchTerm}": 1`
    cy.visit('/artists')
    cy.get('[name="search_term"]').type(`${searchTerm}{enter}`);
    cy.get('h3').should('contain.text', searchResultHeader)
    cy.get('.items').should('contain.text', ctxArtist.name)
  })

  it('should be possible to search for a artist with lowercase in Artists page', () => {
    const searchTerm = ctxArtist.name.toLowerCase();
    const searchResultHeader = `Number of search results for "${searchTerm}": 1`
    cy.visit('/artists')
    cy.get('[name="search_term"]').type(`${searchTerm}{enter}`);
    cy.get('h3').should('contain.text', searchResultHeader)
    cy.get('.items').should('contain.text', ctxArtist.name)
  })

})