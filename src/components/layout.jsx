import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import styled, { ThemeProvider } from 'styled-components'

import theme from '../styles/theme'
import GlobalStyle from '../styles/globalStyle'

import Header from './header'
import Footer from './footer'
import MainGrid, { MainGridColumns } from './mainGrid'

const GlobalWrapper = styled.div`
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
`

const HiddenTextMedium = styled.div`
  display: none;
  font-family: font-medium, Arial, sans-serif;
`

const HiddenTextBold = styled.div`
  display: none;
  font-family: font-bold, Arial, sans-serif;
`

const Layout = ({ children }) => (
  <StaticQuery
    query={graphql`
      {
        site {
          siteMetadata {
            title
          }
        }
        contentfulFontContainer(name: { eq: "NeuzeitOffice" }) {
          name
          lizenztext {
            lizenztext
          }
          lizenzUrl
          light {
            name
            woff {
              file {
                url
              }
            }
            woff2 {
              file {
                url
              }
            }
          }
          medium {
            name
            woff {
              file {
                url
              }
            }
            woff2 {
              file {
                url
              }
            }
          }
          bold {
            name
            woff {
              file {
                url
              }
            }
            woff2 {
              file {
                url
              }
            }
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
            <GlobalStyle theme={theme} fonts={data.contentfulFontContainer} />
            <GlobalWrapper>
              <MainGrid>
                <SideBackground />
                <Header />
                {children}
                <Footer />
              </MainGrid>
            </GlobalWrapper>
            <HiddenTextMedium>
              ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäüöß
            </HiddenTextMedium>
            <HiddenTextBold>
              ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäüöß
            </HiddenTextBold>
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
