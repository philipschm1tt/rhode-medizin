import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import { injectGlobal, ThemeProvider } from 'styled-components'
import styledNormalize from 'styled-normalize'
import Logo from './header'
import theme from '../theme'

injectGlobal`
  ${styledNormalize}

  body {
    background-color: ${theme.colors.backgroundMain};
    font-family: sans-serif;
  }
`

const Layout = ({ children }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <>
        <Helmet
          title={data.site.siteMetadata.title}
          meta={[
            { name: 'description', content: 'Sample' },
            { name: 'keywords', content: 'sample, something' },
          ]}
        >
          <html lang="de" />
        </Helmet>
        <ThemeProvider theme={theme}>
          <>
            <Logo />
            {children}
          </>
        </ThemeProvider>
      </>
    )}
  />
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
