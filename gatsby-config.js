require('dotenv').config()

module.exports = {
  siteMetadata: {
    title: 'Rhode Medizintechnik',
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'Heinrich Rhode GmbH',
        short_name: 'Rhode Medizin',
        lang: 'de-DE',
        start_url: '/',
        background_color: '#FFFDF3',
        theme_color: '#4038A0',
        display: 'minimal-ui',
        icon: 'src/images/logo_small_rhode_medizin_white.png', // This path is relative to the root of the site.
      },
    },
    `gatsby-transformer-remark`,
    `gatsby-plugin-offline`,
    `gatsby-plugin-styled-components`,
    `gatsby-plugin-netlify`,
    {
      resolve: `gatsby-source-contentful`,
      options: {
        spaceId: process.env.CONTENTFUL_SPACE_ID || '',
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN || '',
      },
    },
  ],
}
