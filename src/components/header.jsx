import React from 'react'
import styled from 'styled-components'
import logo from '../images/logo.png'
import logo2x from '../images/logo@2x.png'

const Logo = styled.img`
  max-width: 460px;
`

const CompanyType = styled.div`
  text-transform: uppercase;
`

const Header = () => (
  <>
    <Logo
      src={logo}
      srcSet={`${logo}, ${logo2x} 2x`}
      alt="Heinrich Rhode GmbH"
    />
    <CompanyType>Medizintechnik</CompanyType>
  </>
)

export default Header
