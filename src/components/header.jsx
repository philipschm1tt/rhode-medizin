import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { StaticQuery, graphql, Link } from 'gatsby'
import Img from 'gatsby-image'

import MainGrid, { MainGridColumns } from './mainGrid'
import ContentBox from './contentBox'

const HeaderArea = styled(MainGrid)`
  color: ${props => props.theme.colors.companyBlue};
  padding: ${props => props.theme.sizes.outerPadding};

  @media (min-width: ${props => props.theme.sizes.breakpoints.large}) {
    @supports (display: grid) {
      padding: 0;
    }
  }
`

const ConstructionBanner = styled.div`
  color: white;
  background-color: #c31616;
  grid-column: ${MainGridColumns.fullWidth};
  text-align: center;
`

const Logo = styled(Img)`
  max-width: 460px;
`

const CompanyType = styled.div`
  text-transform: uppercase;
  font-size: ${props => props.theme.fontSizes.smallScreens.XL};
  line-height: ${props => props.theme.lineHeights.smallScreens.XL};

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.XL};
    line-height: ${props => props.theme.lineHeights.largeScreens.XL};
  }
`

const Header = props => (
  <StaticQuery
    query={graphql`
      query LogoQuery {
        logo: file(relativePath: { eq: "logo@2x.png" }) {
          childImageSharp {
            fluid(maxWidth: 460) {
              ...GatsbyImageSharpFluid_withWebp_noBase64
            }
          }
        }
      }
    `}
    render={data => (
      <HeaderArea gridRow={props.gridRow} as="header">
        <ConstructionBanner>
          <ContentBox>UNDER CONSTRUCTION</ContentBox>
        </ConstructionBanner>
        <ContentBox extraVerticalPadding="true">
          <Link to="/">
            <Logo
              fluid={data.logo.childImageSharp.fluid}
              alt="Heinrich Rhode GmbH"
              fadeIn={false}
              critical
            />
          </Link>
          <CompanyType>Medizintechnik</CompanyType>
        </ContentBox>
      </HeaderArea>
    )}
  />
)

Header.propTypes = {
  gridRow: PropTypes.string.isRequired,
}

export default Header
