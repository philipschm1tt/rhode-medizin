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
  margin-left: ${props => props.theme.sizes.baseLineHeight};
  float: right;
`

const Footer = () => (
  <FooterArea>
    <ContentBox extraVerticalPadding="true">
      <FooterLink to="/imprint/">Impressum</FooterLink>
      <FooterLink to="/dataPolicy/">Datenschutzhinweis</FooterLink>
    </ContentBox>
  </FooterArea>
)

export default Footer
