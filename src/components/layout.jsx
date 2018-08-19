import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import styled, { ThemeProvider } from 'styled-components'

import theme from '../styles/theme'
import globalStyles from '../styles/globalStyles'

import Header from './header'
import MainGrid, { MainGridColumns } from './mainGrid'

const GlobalWrapper = styled.div`
  ${globalStyles(theme)};

  max-width: 960px;
  margin: 0 auto;
  background-color: ${theme.colors.lightYellow};

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    @supports (display: grid) {
      max-width: none;
      margin: 0;
    }
  }
`

const SideBackground = styled.div`
  background-color: ${props => props.theme.colors.lightBlue};
  grid-column: ${MainGridColumns.sideColumnStart} / ${MainGridColumns.rightEdge};
  grid-row: 1 / 4;
  justify-self: stretch;
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
            <MainGrid>
              <SideBackground />
              <Header />
              {children}
            </MainGrid>
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
