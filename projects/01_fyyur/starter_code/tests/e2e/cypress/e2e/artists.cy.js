import { getTimestamp } from '../support/helpers';

/**
 * Note: The tests can be further enhanced to be isolated, currently they should be run in sequence
 */

describe('Artists', () => {
  const timestamp = getTimestamp();
  const ctxArtist = {
    name: `Artist ${timestamp}`,
    city: 'Dallas',
    state: 'TX',
    genres: ['Alternative', 'Funk'],
    id: ''
  }
  const upcomingShowsNum = 0
  const pastShowsNum = 0
  const upcomingShowsLabel = `${upcomingShowsNum} Upcoming Shows`
  const pastShowsLabel = `${pastShowsNum} Upcoming Shows`

  it('should be possible to create an artist entry with minimum data and be redirected to the newly created artist page', () => {
    const successAlert = `Artist '${ctxArtist.name}' was successfully listed!`
    
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
    cy.location().then((location) => {
      const splitUrl = location.pathname.split('/');
      ctxArtist.id = splitUrl[splitUrl.length - 1];
    });
    checkNotification(successAlert);
    checkArtistFields(ctxArtist, upcomingShowsLabel, pastShowsLabel);
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

  it('should be possible to edit artist', () => {
    const editFormHeading = `Edit artist ${ctxArtist.name}`
    cy.visit(`/artists/${ctxArtist.id}`)
    cy.get('[data-testid="edit-artist-button"]').click()
    cy.get('h3.form-heading').should('contain.text', editFormHeading)
    cy.get('[id="name"]').should('have.value', ctxArtist.name)
    cy.get('[id="city"]').should('have.value', ctxArtist.city)
    cy.get('[id="state"]').invoke('val').should('deep.equal', ctxArtist.state)
    cy.get('[id="genres"]').invoke('val').should('deep.equal', ctxArtist.genres)

    ctxArtist.name = `${ctxArtist.name} Edited`
    ctxArtist.city = `${ctxArtist.city} Edited`
    const successAlert = `Artist '${ctxArtist.name}' was successfully edited!`

    cy.get('[id="name"]').clear().type(ctxArtist.name);
    cy.get('[id="city"]').clear().type(ctxArtist.city);

    cy.get('[data-testid="post-edited-artist"]').click()
    checkNotification(successAlert);
    checkArtistFields(ctxArtist, upcomingShowsLabel, pastShowsLabel);
  })

  it('should be possible to delete an artist', () => {
    const successAlert = `Artist '${ctxArtist.id}' was successfully deleted!`
    cy.visit(`/artists/${ctxArtist.id}`)
    cy.get('[data-testid="delete-artist-button"]').click()
    cy.get('.alert').should('contain.text', successAlert)
    ctxArtist.id = '';
    cy.location('pathname').should('eq', '/')
  })
  
  after('delete artist', () => {
    // Delete the artist after test finished
    if (ctxArtist.id) {
      cy.request('POST', `/artists/${ctxArtist.id}/delete`).then((resp) => expect(resp.status).to.eq(200))
    }
  })
})

function checkNotification(successAlert) {
  cy.get('.alert').should('contain.text', successAlert);
}

function checkArtistFields(artist, upcomingShowsLabel, pastShowsLabel) {
  cy.get('h1').should('contain.text', artist.name);
  artist.genres.forEach((genre) => cy.get('.genres').should('contain.text', genre)
  );
  cy.get('.row').should('contain.text', artist.city);
  cy.get('.row').should('contain.text', artist.state);
  cy.get('h2').should('contain.text', upcomingShowsLabel);
  cy.get('h2').should('contain.text', pastShowsLabel);
}
