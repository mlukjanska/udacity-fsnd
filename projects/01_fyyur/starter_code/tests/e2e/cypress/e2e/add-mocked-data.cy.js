import artists from '../fixtures/artists.json'
import venues from '../fixtures/venues.json'
import shows from '../fixtures/shows.json'

/**
 * Limitation in Cypress request to send multiple values with the same key in POST FormData
 * https://github.com/cypress-io/cypress/issues/17921
 * Hence modified the mocked data to have only a single genre
 */

const ctxArtists = []
const ctxVenues = []

describe('Setup mocked data', () => {
  it('adds artists mock data', () => {
    artists.forEach((artist) => {
      delete artist['id']
      cy.request({
        method: 'POST',
        url: '/artists/create', // baseUrl is prepend to URL
        form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
        body: artist,
      }).then((req) => { 
          cy.log(req)    
          const splitUrl = req.redirects[0].split('/')
          const ctxArtist = {
            id: splitUrl[splitUrl.length - 1],
            name: artist.name
          }
          ctxArtists.push(ctxArtist)
      })
    })
  })

  it('adds venues mock data', () => {
    venues.forEach((venue) => {
      delete venue['id']
      cy.intercept('GET', '/venues/*').as('getVenues')
      cy.request({
        method: 'POST',
        url: '/venues/create', // baseUrl is prepend to URL
        form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
        body: venue,
      }).then((req) => {     
        const splitUrl = req.redirects[0].split('/')
        const ctxVenue = {
          id: splitUrl[splitUrl.length - 1],
          name: venue.name
        }
        ctxVenues.push(ctxVenue)
      })
    })
  })

  it('adds shows mock data', () => {
    shows.forEach((show) => {
      const venue = ctxVenues.filter((venue) => venue.name == show.venue_name)
      expect(venue.length).to.eq(1)
      const artist = ctxArtists.filter((artist) => artist.name == show.artist_name)
      expect(artist.length).to.eq(1)
      const body = {
          venue_id: venue[0].id,
          artist_id: artist[0].id,
          start_time: show.start_time
      }
      cy.log(body)
      cy.request({
        method: 'POST',
        url: '/shows/create', // baseUrl is prepend to URL
        form: true, // indicates the body should be form urlencoded and sets Content-Type: application/x-www-form-urlencoded headers
        body,
      }).then((resp) => {
        expect(resp.status).to.eq(200)
      })
    })
  })

})