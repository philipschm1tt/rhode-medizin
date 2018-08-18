import React from 'react'
import styled from 'styled-components'
import logo from '../images/logo.png'
import logo2x from '../images/logo@2x.png'
import ContentBox from './contentBox'

const HeaderArea = styled.header`
  color: ${props => props.theme.colors.companyBlue};
  padding: ${props => props.theme.sizes.outerPadding};

  grid-column: main-column-start / side-column-end;
  grid-row: 1;

  @supports (display: grid) {
    padding: 0;
  }
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
    <ContentBox extraVerticalPadding="true">
      <Logo
        src={logo}
        srcSet={`${logo}, ${logo2x} 2x`}
        alt="Heinrich Rhode GmbH"
      />
      <CompanyType>Medizintechnik</CompanyType>
    </ContentBox>
  </HeaderArea>
)

export default Header
