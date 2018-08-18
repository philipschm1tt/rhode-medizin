import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import styled, { ThemeProvider } from 'styled-components'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import Logo from './header'

const GlobalWrapper = styled.div`
  ${globalStyles(theme)};

  max-width: 960px;
  margin: 0 auto;
  background-color: ${theme.colors.lightYellow};

  @supports (display: grid) {
    max-width: none;
    margin: 0;

    display: grid;
    grid-template-columns:
      1.618fr
      [main-column-start] 4.854fr [main-column-end side-column-start] 3fr [side-column-end]
      1fr;
  }
`

const SideBackground = styled.div`
  background-color: ${props => props.theme.colors.lightBlue};
  grid-column: side-column-start / 5;
  grid-row: 1 / 4;
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
          <GlobalWrapper>
            <SideBackground />
            <Logo />
            {children}
          </GlobalWrapper>
        </ThemeProvider>
      </>
    )}
  />
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
