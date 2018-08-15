import React from 'react'
import styled from 'styled-components'
import logo from '../images/logo.png'
import logo2x from '../images/logo@2x.png'

const HeaderArea = styled.div`
  color: ${props => props.theme.colors.companyBlue};
  margin: 20px;
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

const Header = () => (
  <HeaderArea>
    <Logo
      src={logo}
      srcSet={`${logo}, ${logo2x} 2x`}
      alt="Heinrich Rhode GmbH"
    />
    <CompanyType>Medizintechnik</CompanyType>
  </HeaderArea>
)

export default Header
