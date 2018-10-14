import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Link } from 'gatsby'

import MainGrid from './mainGrid'
import ContentBox from './contentBox'

const FooterArea = styled(MainGrid)`
  background-color: ${props => props.theme.colors.darkPurple};
  color: ${props => props.theme.colors.lightYellow};
`

const FooterLink = styled(Link)`
  color: ${props => props.theme.colors.lightYellow};
  margin-right: ${props => props.theme.sizes.baseLineHeight};
`

const ExternalFooterLink = styled.a`
  float: right;
  width: 100px;
`

const Footer = props => (
  <FooterArea gridRow={props.gridRow} as="footer">
    <ContentBox extraVerticalPadding="true">
      <FooterLink to="/imprint/">Impressum</FooterLink>
      <FooterLink to="/data-policy/">Datenschutzhinweis</FooterLink>
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

Footer.propTypes = {
  gridRow: PropTypes.string.isRequired,
}

export default Footer
