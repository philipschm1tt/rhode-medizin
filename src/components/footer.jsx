import React from 'react'
import styled from 'styled-components'
import { Link } from 'gatsby'

import MainGrid, { MainGridColumns } from './mainGrid'
import ContentBox from './contentBox'

const FooterArea = MainGrid.withComponent('footer').extend`
  background-color: ${props => props.theme.colors.darkPurple};
  color: ${props => props.theme.colors.lightYellow};

  grid-column: ${MainGridColumns.fullWidth};
  grid-row: 3;
`

const FooterLink = styled(Link)`
  color: ${props => props.theme.colors.lightYellow};
  margin-right: ${props => props.theme.sizes.baseLineHeight};
`

const ExternalFooterLink = styled.a`
  float: right;
  width: 100px;
`

const Footer = () => (
  <FooterArea>
    <ContentBox extraVerticalPadding="true">
      <FooterLink to="/imprint/">Impressum</FooterLink>
      <FooterLink to="/dataPolicy/">Datenschutzhinweis</FooterLink>
      <ExternalFooterLink
        href="https://www.contentful.com/"
        rel="nofollow noopener noreferrer"
        target="_blank"
      >
        <img
          src="https://images.ctfassets.net/fo9twyrwpveg/7Htleo27dKYua8gio8UEUy/0797152a2d2f8e41db49ecbf1ccffdaa/PoweredByContentful_DarkBackground_MonochromeLogo.svg"
          alt="Powered by Contentful"
        />
      </ExternalFooterLink>
    </ContentBox>
  </FooterArea>
)

export default Footer
