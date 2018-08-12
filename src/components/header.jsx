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
  font-size: ${props => props.theme.fontSizes.XL};
  line-height: ${props => props.theme.lineHeights.XL};
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
