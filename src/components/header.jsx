import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Link } from 'gatsby'

import MainGrid, { MainGridColumns } from './mainGrid'
import ContentBox from './contentBox'

import logo from '../images/logo.png'
import logo2x from '../images/logo@2x.png'

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

const Logo = styled.img`
  max-width: 100%;
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
  <HeaderArea gridRow={props.gridRow} as="header">
    <ConstructionBanner>
      <ContentBox>UNDER CONSTRUCTION</ContentBox>
    </ConstructionBanner>
    <ContentBox extraVerticalPadding="true">
      <Link to="/">
        <Logo
          src={logo}
          srcSet={`${logo}, ${logo2x} 2x`}
          alt="Heinrich Rhode GmbH"
        />
      </Link>
      <CompanyType>Medizintechnik</CompanyType>
    </ContentBox>
  </HeaderArea>
)

Header.propTypes = {
  gridRow: PropTypes.string.isRequired,
}

export default Header
